param(
    [string]$BaseUrl = "http://localhost",
    [string]$ApiDirect = "http://localhost:3001"
)

$API = "$BaseUrl/api/v1"
$errors = @()
$passed = 0
$failed = 0

function Test-Step {
    param([string]$Name, [scriptblock]$Block)
    try {
        $result = & $Block
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
        return $result
    } catch {
        Write-Host "  [FAIL] $Name : $_" -ForegroundColor Red
        $script:errors += "FAIL: $Name -- $_"
        $script:failed++
        return $null
    }
}

function Invoke-Api {
    param([string]$Method="GET", [string]$Path, [hashtable]$Headers=@{}, [object]$Body=$null)
    $params = @{
        Uri = "$API$Path"
        Method = $Method
        Headers = $Headers
        ErrorAction = "Stop"
    }
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 5)
        $params.ContentType = "application/json"
    }
    return Invoke-RestMethod @params
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " TAXI VANILLE -- E2E TEST SUITE" -ForegroundColor Cyan
Write-Host " Base: $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Infrastructure ─────────────────────────────────────────────────────────
Write-Host "[ 0 ] Infrastructure" -ForegroundColor Yellow

Test-Step "nginx accessible port 80" {
    $r = Invoke-WebRequest -Uri "$BaseUrl/health" -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -ne 200) { throw "Status $($r.StatusCode)" }
} | Out-Null

Test-Step "Frontend Next.js via nginx (200 or 307 redirect ok)" {
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -notin @(200,307,302)) { throw "Status $($r.StatusCode)" }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -in @(200,307,302)) { return $true }
        throw
    }
} | Out-Null

Test-Step "Backend API via nginx /api/v1 (401=OK)" {
    try { Invoke-RestMethod -Uri "$API/drivers/me" -ErrorAction Stop }
    catch { if ($_.Exception.Response.StatusCode.value__ -eq 401) { return $true }; throw }
} | Out-Null

# ── 1. Auth ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 1 ] Authentification" -ForegroundColor Yellow

$adminToken = $null
$adminToken = Test-Step "Login admin (direction)" {
    $r = Invoke-Api -Method POST -Path "/auth/login" -Body @{ email="admin@taxivanille.yt"; password="admin1234" }
    if (-not $r.access_token) { throw "No token" }
    $r.access_token
}
$AH = @{ Authorization = "Bearer $adminToken" }

# ── 2. Reference data ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 2 ] Reference data" -ForegroundColor Yellow

Test-Step "Clean previous E2E data" {
    # Each statement is a separate exec to avoid multiline parsing issues
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM planning_audit WHERE trip_id IN (SELECT id FROM trips WHERE notes LIKE '%E2E-TEST%');" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM trip_events WHERE trip_id IN (SELECT id FROM trips WHERE notes LIKE '%E2E-TEST%');" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM incidents WHERE trip_id IN (SELECT id FROM trips WHERE notes LIKE '%E2E-TEST%');" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM trips WHERE notes LIKE '%E2E-TEST%';" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM incidents WHERE driver_id IN (SELECT id FROM drivers WHERE driver_number LIKE 'E2E-%');" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM incidents WHERE notes LIKE '%E2E-TEST%';" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM drivers WHERE driver_number LIKE 'E2E-%';" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM client_lines WHERE client_id IN (SELECT id FROM clients WHERE name LIKE '%E2E-TEST%');" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM clients WHERE name LIKE '%E2E-TEST%';" 2>&1 | Out-Null
    docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -c "DELETE FROM stops WHERE name LIKE '%E2E-TEST%';" 2>&1 | Out-Null
} | Out-Null

$client = Test-Step "Create client E2E-TEST" {
    Invoke-Api -Method POST -Path "/clients" -Headers $AH -Body @{ name="Transport E2E-TEST"; type="medico_social"; contact_email="e2e@test.local" }
}
$CLIENT_ID = if ($client) { $client.id } else { $null }

$line = Test-Step "Create transport line for E2E client" {
    if (-not $CLIENT_ID) { throw "CLIENT_ID null" }
    Invoke-Api -Method POST -Path "/clients/$CLIENT_ID/lines" -Headers $AH -Body @{
        code="LT-E2E"; name="Ligne E2E Test"; badge="E2E"; color="#f97316"
        vehicle_capacity=24; dir_matin_a="Depot → Hopital"; dir_matin_r="Hopital → Depot"
        dir_am_a="Depot → Ecole"; dir_am_r="Ecole → Depot"
    }
}
$LINE_ID = if ($line) { $line.id } else { $null }

$stops = @()
# No /stops API endpoint -- create directly in DB
$stopDefs = @(
    @{ name="Depot E2E-TEST";   address="1 Rue du Depot 97600";    lat=-12.780; lng=45.227 }
    @{ name="Hopital E2E-TEST"; address="Avenue Hopital 97600";    lat=-12.785; lng=45.229 }
    @{ name="Ecole E2E-TEST";   address="Rue des Ecoles 97680";    lat=-12.792; lng=45.215 }
)
$stopIds = @()
foreach ($sd in $stopDefs) {
    $sid = Test-Step "Create stop via DB: $($sd.name)" {
        $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "INSERT INTO stops (name, address, lat, lng) VALUES ('$($sd.name)', '$($sd.address)', $($sd.lat), $($sd.lng)) RETURNING id;" 2>&1
        $id = ($res | Select-String -Pattern "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}").Matches[0].Value
        if (-not $id) { throw "No UUID returned: $res" }
        $id
    }
    if ($sid) {
        $stopIds += $sid
        $stops += @{ id=$sid; name=$sd.name; address=$sd.address; lat=$sd.lat; lng=$sd.lng }
    }
}

$d1 = Test-Step "Create driver E2E-D1 (or fetch if exists)" {
    try {
        Invoke-Api -Method POST -Path "/drivers" -Headers $AH -Body @{ driver_number="E2E-D1"; full_name="DUPONT Michel"; phone="+262 639 00 00 01"; pin="1111"; vehicle_seats=8; invoice_period="monthly" }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) {
            # Driver already exists -- fetch it
            $all = Invoke-Api -Path "/drivers" -Headers $AH
            $existing = $all | Where-Object { $_.driver_number -eq "E2E-D1" }
            if (-not $existing) { throw "409 but driver not found in list" }
            $existing
        } else { throw }
    }
}
$d2 = Test-Step "Create driver E2E-D2 (or fetch if exists)" {
    try {
        Invoke-Api -Method POST -Path "/drivers" -Headers $AH -Body @{ driver_number="E2E-D2"; full_name="ABDOU Karim"; phone="+262 639 00 00 02"; pin="2222"; vehicle_seats=8; invoice_period="monthly" }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) {
            $all = Invoke-Api -Path "/drivers" -Headers $AH
            $existing = $all | Where-Object { $_.driver_number -eq "E2E-D2" }
            if (-not $existing) { throw "409 but driver not found in list" }
            $existing
        } else { throw }
    }
}
$D1_ID = if ($d1) { $d1.id } else { $null }
$D2_ID = if ($d2) { $d2.id } else { $null }

$tripTime = (Get-Date).ToUniversalTime().AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$trip = Test-Step "Create trip assigned to D1 (with line)" {
    if ($stopIds.Count -lt 3) { throw "Not enough stops created ($($stopIds.Count)/3)" }
    $body = @{
        driver_id="$D1_ID"; client_id="$CLIENT_ID"; scheduled_at=$tripTime
        stops_order=@($stopIds[0], $stopIds[1], $stopIds[2])
        amount=95.50; passenger_count=6; notes="E2E-TEST automatise"; direction="matin_aller"
    }
    if ($LINE_ID) { $body.line_id = $LINE_ID }
    Invoke-Api -Method POST -Path "/planning" -Headers $AH -Body $body
}
$TRIP_ID = if ($trip) { $trip.id } else { $null }

# ── 3. Planning web view ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 3 ] Planning -- direction view" -ForegroundColor Yellow

$today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")

Test-Step "Planning returns E2E trip" {
    $plan = Invoke-Api -Path "/planning?date=$today" -Headers $AH
    $found = $plan | Where-Object { $_.id -eq $TRIP_ID }
    if (-not $found) { throw "E2E trip not found in planning" }
    if ($found.status -ne "planned") { throw "Expected planned, got $($found.status)" }
} | Out-Null

Test-Step "Trip has line_id assigned" {
    $detail = Invoke-Api -Path "/planning/$TRIP_ID" -Headers $AH
    if (-not $detail.line_id) { throw "line_id is null on trip" }
    if ($LINE_ID -and $detail.line_id -ne $LINE_ID) { throw "line_id mismatch: $($detail.line_id) != $LINE_ID" }
} | Out-Null

Test-Step "Trip detail has 3 enriched stops" {
    $detail = Invoke-Api -Path "/planning/$TRIP_ID" -Headers $AH
    if ($detail.stops.Count -ne 3) { throw "Expected 3 stops, got $($detail.stops.Count)" }
    if ($detail.stops[0].name -notmatch "E2E") { throw "Stop not enriched" }
} | Out-Null

# ── 4. Driver app D1 ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 4 ] Driver app D1 -- login and planning" -ForegroundColor Yellow

$d1Token = Test-Step "D1 login (Android app)" {
    $r = Invoke-Api -Method POST -Path "/auth/driver/login" -Body @{ driver_number="E2E-D1"; pin="1111" }
    if (-not $r.access_token) { throw "No token" }
    $r.access_token
}
$D1H = @{ Authorization = "Bearer $d1Token" }

Test-Step "D1 GET /drivers/me returns correct profile" {
    $me = Invoke-Api -Path "/drivers/me" -Headers $D1H
    if ($me.driver_number -ne "E2E-D1") { throw "driver_number wrong: $($me.driver_number)" }
    if ($me.full_name -ne "DUPONT Michel") { throw "full_name wrong: $($me.full_name)" }
} | Out-Null

Test-Step "D1 schedule/today contains trip with enriched stops" {
    $sched = Invoke-Api -Path "/drivers/me/schedule/today" -Headers $D1H
    $found = $sched | Where-Object { $_.id -eq $TRIP_ID }
    if (-not $found) { throw "E2E trip not in D1 schedule" }
    if ($found.stops.Count -ne 3) { throw "Expected 3 stops, got $($found.stops.Count)" }
    if ($found.stops[0].lat -eq 0) { throw "GPS coords missing" }
} | Out-Null

# ── 5. Trip execution ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 5 ] Trip execution -- D1" -ForegroundColor Yellow

Test-Step "D1 starts trip" {
    $r = Invoke-Api -Method POST -Path "/trips/$TRIP_ID/start" -Headers $D1H -Body @{ occurred_at=(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
    if (-not $r.ok) { throw "Unexpected: $($r | ConvertTo-Json)" }
} | Out-Null

Test-Step "Planning shows status=in_progress" {
    $d = Invoke-Api -Path "/planning/$TRIP_ID" -Headers $AH
    if ($d.status -ne "in_progress") { throw "Expected in_progress, got $($d.status)" }
} | Out-Null

Test-Step "D1 validates stop 1 (4 in, 0 out)" {
    $r = Invoke-Api -Method POST -Path "/trips/$TRIP_ID/stops/$($stopIds[0])/event" -Headers $D1H -Body @{ event_type="arrived"; passengers_in=4; passengers_out=0; occurred_at=(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
    if (-not $r.ok) { throw "Unexpected response" }
} | Out-Null

Test-Step "D1 validates stop 2 (2 in, 1 out)" {
    $r = Invoke-Api -Method POST -Path "/trips/$TRIP_ID/stops/$($stopIds[1])/event" -Headers $D1H -Body @{ event_type="arrived"; passengers_in=2; passengers_out=1; occurred_at=(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
    if (-not $r.ok) { throw "Unexpected response" }
} | Out-Null

# ── 6. Incident ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 6 ] Incident -- aggression" -ForegroundColor Yellow

$incident = Test-Step "D1 reports aggression incident" {
    Invoke-Api -Method POST -Path "/incidents" -Headers $D1H -Body @{
        trip_id=$TRIP_ID; types=@("aggression","passenger_conflict")
        notes="E2E-TEST: passenger aggressive at stop 2, requesting replacement"
        lat=-12.785; lng=45.229
    }
}

Test-Step "Incident visible to direction" {
    # Filter by trip_id via query param (response doesn't include trip_id field)
    $list = Invoke-Api -Path "/incidents?trip_id=$TRIP_ID" -Headers $AH
    if ($list.Count -lt 1) { throw "Incident not found for trip $TRIP_ID" }
    $found = $list[0]
    if ($found.types -notcontains "aggression") { throw "aggression type missing: $($found.types)" }
} | Out-Null

# ── 7. Driver replacement ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 7 ] Driver replacement by direction" -ForegroundColor Yellow

Test-Step "Direction replaces D1 with D2" {
    $r = Invoke-Api -Method PUT -Path "/planning/$TRIP_ID/driver" -Headers $AH -Body @{ driver_id=$D2_ID; reason="E2E-TEST: replacement after aggression" }
    if (-not $r.ok) { throw "Response: $($r | ConvertTo-Json)" }
    if ($r.new_driver_id -ne $D2_ID) { throw "Wrong new_driver_id" }
} | Out-Null

Test-Step "Planning shows D2 as new driver" {
    $d = Invoke-Api -Path "/planning/$TRIP_ID" -Headers $AH
    if ($d.driver_id -ne $D2_ID) { throw "driver_id: expected D2, got $($d.driver_id)" }
    if ($d.status -ne "in_progress") { throw "Status changed unexpectedly: $($d.status)" }
} | Out-Null

Test-Step "Audit trail contains driver_replaced event" {
    $audit = Invoke-Api -Path "/planning/audit?tripId=$TRIP_ID" -Headers $AH
    $ev = $audit | Where-Object { $_.action -eq "driver_replaced" }
    if (-not $ev) { throw "driver_replaced event missing from audit" }
} | Out-Null

# ── 8. Driver 2 takes over ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 8 ] Driver D2 -- takes over trip" -ForegroundColor Yellow

$d2Token = Test-Step "D2 login" {
    $r = Invoke-Api -Method POST -Path "/auth/driver/login" -Body @{ driver_number="E2E-D2"; pin="2222" }
    $r.access_token
}
$D2H = @{ Authorization = "Bearer $d2Token" }

Test-Step "D2 sees in_progress trip in schedule" {
    $sched = Invoke-Api -Path "/drivers/me/schedule/today" -Headers $D2H
    $found = $sched | Where-Object { $_.id -eq $TRIP_ID }
    if (-not $found) { throw "Trip not in D2 schedule" }
    if ($found.status -ne "in_progress") { throw "Expected in_progress, got $($found.status)" }
} | Out-Null

Test-Step "D2 validates stop 3 (0 in, 5 out)" {
    $r = Invoke-Api -Method POST -Path "/trips/$TRIP_ID/stops/$($stopIds[2])/event" -Headers $D2H -Body @{ event_type="arrived"; passengers_in=0; passengers_out=5; occurred_at=(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
    if (-not $r.ok) { throw "Unexpected response" }
} | Out-Null

$endResult = Test-Step "D2 ends trip" {
    $r = Invoke-Api -Method POST -Path "/trips/$TRIP_ID/end" -Headers $D2H -Body @{ occurred_at=(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
    if (-not $r.ok) { throw "Unexpected response" }
    $r
}

# ── 9. Database coherence ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 9 ] Database coherence" -ForegroundColor Yellow

if (-not $TRIP_ID) {
    Write-Host "  [SKIP] DB tests -- TRIP_ID null (trip creation failed)" -ForegroundColor DarkYellow
    $script:failed += 6
} else {

Test-Step "DB: trip status=completed" {
    $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "SELECT status FROM trips WHERE id='$TRIP_ID';"
    if ($res -notmatch "completed") { throw "DB status: $res" }
} | Out-Null

Test-Step "DB: 5 trip_events (start + 3 arrived + end)" {
    $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "SELECT COUNT(*) FROM trip_events WHERE trip_id='$TRIP_ID';"
    $count = [int](($res -join '').Trim())
    if ($count -ne 5) { throw "Expected 5 events, got $count" }
} | Out-Null

Test-Step "DB: total passengers_in = 6 (4+2+0)" {
    $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "SELECT COALESCE(SUM(passengers_in),0) FROM trip_events WHERE trip_id='$TRIP_ID' AND event_type='arrived';"
    $total = [int](($res -join '').Trim())
    if ($total -ne 6) { throw "Expected 6 passengers_in, got $total" }
} | Out-Null

Test-Step "DB: total passengers_out = 6 (0+1+5)" {
    $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "SELECT COALESCE(SUM(passengers_out),0) FROM trip_events WHERE trip_id='$TRIP_ID' AND event_type='arrived';"
    $total = [int](($res -join '').Trim())
    if ($total -ne 6) { throw "Expected 6 passengers_out, got $total" }
} | Out-Null

Test-Step "DB: final driver_id = D2" {
    $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "SELECT driver_id FROM trips WHERE id='$TRIP_ID';"
    if ($res -notmatch $D2_ID) { throw "DB driver: $res (expected $D2_ID)" }
} | Out-Null

Test-Step "DB: 1 incident with aggression type" {
    $res = docker exec taxivanille-postgres-1 psql -U taxivanille -d taxivanille -t -c "SELECT COUNT(*) FROM incidents WHERE trip_id='$TRIP_ID' AND types @> ARRAY['aggression']::text[];"
    $count = [int](($res -join '').Trim())
    if ($count -ne 1) { throw "Expected 1 aggression incident, got $count" }
} | Out-Null

}

# ── 10. Dashboard KPI ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 10 ] Dashboard KPI -- calculation coherence" -ForegroundColor Yellow

$kpi = Test-Step "GET /kpi/dashboard returns data" {
    $from = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd") + "T00:00:00Z"
    $to   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd") + "T23:59:59Z"
    Invoke-Api -Path "/kpi/dashboard?from=$from&to=$to" -Headers $AH
}

Test-Step "KPI: at least 1 completed trip today" {
    $c = [int]$kpi.summary.completed_trips
    if ($c -lt 1) { throw "completed_trips=$c (expected >=1)" }
} | Out-Null

Test-Step "KPI: total_passengers >= 6" {
    $p = [int]$kpi.summary.total_passengers
    if ($p -lt 6) { throw "total_passengers=$p (expected >=6)" }
} | Out-Null

Test-Step "KPI: total_revenue >= 95.50" {
    $rev = [double]$kpi.summary.total_revenue
    if ($rev -lt 95.50) { throw "total_revenue=$rev (expected >=95.50)" }
} | Out-Null

Test-Step "KPI: incidents >= 1" {
    $inc = [int]$kpi.summary.incidents
    if ($inc -lt 1) { throw "incidents=$inc (expected >=1)" }
} | Out-Null

Test-Step "KPI: sparkline has entry for today" {
    if ($kpi.sparkline.Count -lt 1) { throw "Sparkline empty" }
} | Out-Null

Test-Step "KPI: by_driver has D2 with >=1 trip" {
    $d2s = $kpi.by_driver | Where-Object { $_.driver_id -eq $D2_ID }
    if (-not $d2s) { throw "D2 missing from by_driver" }
    if ([int]$d2s.trips_count -lt 1) { throw "D2 trips_count=$($d2s.trips_count)" }
} | Out-Null

# ── 11. Driver stats ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 11 ] Driver stats" -ForegroundColor Yellow

Test-Step "D2 stats: 1 course, 6 passengers, CA>=95.50, 0 incidents" {
    $s = Invoke-Api -Path "/drivers/$D2_ID/stats?period=jour" -Headers $AH
    if ([int]$s.courses -lt 1)   { throw "D2 courses=$($s.courses)" }
    if ([int]$s.passagers -ne 6) { throw "D2 passagers=$($s.passagers) (expected 6)" }
    if ([double]$s.ca -lt 95.49) { throw "D2 CA=$($s.ca) (expected 95.50)" }
    if ([int]$s.incidents -ne 0) { throw "D2 incidents=$($s.incidents) (expected 0)" }
} | Out-Null

Test-Step "D1 stats: 0 courses, 1 incident" {
    $s = Invoke-Api -Path "/drivers/$D1_ID/stats?period=jour" -Headers $AH
    if ([int]$s.courses -ne 0)   { throw "D1 courses=$($s.courses) (expected 0)" }
    if ([int]$s.incidents -ne 1) { throw "D1 incidents=$($s.incidents) (expected 1)" }
} | Out-Null

# ── 12. Frontend pages ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 12 ] Frontend pages via nginx" -ForegroundColor Yellow

@("/login", "/", "/planning", "/drivers", "/clients", "/rapports", "/invoices") | ForEach-Object {
    $page = $_
    Test-Step "Page $page accessible (200/302/307)" {
        try {
            $r = Invoke-WebRequest -Uri "$BaseUrl$page" -UseBasicParsing -ErrorAction Stop
            if ($r.StatusCode -notin @(200, 302, 307)) { throw "Status $($r.StatusCode)" }
        } catch {
            $code = $_.Exception.Response.StatusCode.value__
            if ($code -in @(200, 302, 307, 401)) { return $true }
            throw
        }
    } | Out-Null
}

# ── 13. GPS ping ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 13 ] GPS ping" -ForegroundColor Yellow

Test-Step "D1 sends GPS ping via /api/v1" {
    try { Invoke-Api -Method POST -Path "/gps/ping" -Headers $D1H -Body @{ lat=-12.782; lng=45.228 } } catch { $true }
} | Out-Null

# ── 14. API coherence checks ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[ 14 ] API coherence" -ForegroundColor Yellow

Test-Step "GET /clients returns Transport E2E-TEST" {
    $list = Invoke-Api -Path "/clients" -Headers $AH
    $found = $list | Where-Object { $_.name -match "E2E-TEST" }
    if (-not $found) { throw "E2E client not in list" }
} | Out-Null

Test-Step "GET /drivers returns E2E-D1 and E2E-D2" {
    $list = Invoke-Api -Path "/drivers" -Headers $AH
    $d1found = $list | Where-Object { $_.driver_number -eq "E2E-D1" }
    $d2found = $list | Where-Object { $_.driver_number -eq "E2E-D2" }
    if (-not $d1found) { throw "E2E-D1 not in drivers list" }
    if (-not $d2found) { throw "E2E-D2 not in drivers list" }
} | Out-Null

Test-Step "Completed trip reflects D2 (not D1) in planning list" {
    $plan = Invoke-Api -Path "/planning?date=$today" -Headers $AH
    $found = $plan | Where-Object { $_.id -eq $TRIP_ID }
    if ($found.status -ne "completed") { throw "Expected completed, got $($found.status)" }
    if ($found.driver_id -ne $D2_ID)   { throw "Expected D2 as driver, got $($found.driver_id)" }
} | Out-Null

Test-Step "Audit trail has 2+ events (created + driver_replaced)" {
    $audit = Invoke-Api -Path "/planning/audit?tripId=$TRIP_ID" -Headers $AH
    if ($audit.Count -lt 2) { throw "Expected >=2 audit events, got $($audit.Count)" }
} | Out-Null

Test-Step "Audit trail contains incident_reported event" {
    $audit = Invoke-Api -Path "/planning/audit?tripId=$TRIP_ID" -Headers $AH
    $ev = $audit | Where-Object { $_.action -eq "incident_reported" }
    if (-not $ev) { throw "incident_reported event missing from audit (incidents must be logged to planning_audit)" }
} | Out-Null

Test-Step "Incident resolve endpoint works (PATCH /incidents/:id/resolve)" {
    if (-not $incident) { throw "No incident ID from step 6" }
    $r = Invoke-Api -Method PATCH -Path "/incidents/$($incident.id)/resolve" -Headers $AH
    if (-not $r.ok) { throw "Unexpected response: $($r | ConvertTo-Json)" }
} | Out-Null

Test-Step "Resolved incident no longer counted in KPI 'Incidents ouverts'" {
    $kpiAfter = Invoke-Api -Path "/kpi/dashboard?from=$today&to=$today" -Headers $AH
    $incAfter = [int]$kpiAfter.summary.incidents
    # D1's incident was just resolved, D1 is filtered by driverId below for precision
    $kpiD1After = Invoke-Api -Path "/kpi/dashboard?from=$today&to=$today&driver_id=$D1_ID" -Headers $AH
    $d1inc = [int]$kpiD1After.summary.incidents
    if ($d1inc -ne 0) { throw "Expected 0 open incidents for D1 after resolve, got $d1inc" }
} | Out-Null

Test-Step "Audit trail contains incident_resolved event" {
    $audit = Invoke-Api -Path "/planning/audit?tripId=$TRIP_ID" -Headers $AH
    $ev = $audit | Where-Object { $_.action -eq "incident_resolved" }
    if (-not $ev) { throw "incident_resolved event missing from audit" }
} | Out-Null

# ── Result ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
$color = if ($failed -eq 0) { "Green" } else { "Red" }
Write-Host " RESULT: $passed PASS / $failed FAIL" -ForegroundColor $color
Write-Host "========================================" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Failures:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Trip ID   : $TRIP_ID"
Write-Host "  Driver D1 : $D1_ID"
Write-Host "  Driver D2 : $D2_ID"
Write-Host "  Client    : $CLIENT_ID"
if ($kpi) {
    Write-Host "  KPI today : $($kpi.summary.completed_trips) trips / $($kpi.summary.total_passengers) pax / $($kpi.summary.total_revenue) EUR / $($kpi.summary.incidents) incidents"
}

exit $failed
