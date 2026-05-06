import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('taxivanille.db');

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schedule (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS event_queue (
      local_id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gps_buffer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy_m REAL,
      trip_id TEXT,
      recorded_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS incidents_queue (
      local_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      audio_path TEXT,
      created_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);
}

export function saveSchedule(trips: any[]) {
  db.runSync(
    'INSERT OR REPLACE INTO schedule (id, data, fetched_at) VALUES (?, ?, ?)',
    ['today', JSON.stringify(trips), Date.now()]
  );
}

export function getSchedule(): any[] {
  const row = db.getFirstSync<{ data: string }>('SELECT data FROM schedule WHERE id = ?', ['today']);
  return row ? JSON.parse(row.data) : [];
}

export function enqueueEvent(localId: string, type: string, payload: object) {
  db.runSync(
    'INSERT INTO event_queue (local_id, type, payload, created_at) VALUES (?, ?, ?, ?)',
    [localId, type, JSON.stringify(payload), Date.now()]
  );
}

export function getPendingEvents() {
  return db.getAllSync<{ local_id: string; type: string; payload: string }>(
    'SELECT * FROM event_queue WHERE synced = 0 ORDER BY created_at'
  ).map(r => ({ ...r, payload: JSON.parse(r.payload) }));
}

export function markEventSynced(localId: string) {
  db.runSync('UPDATE event_queue SET synced = 1 WHERE local_id = ?', [localId]);
}

export function bufferGps(lat: number, lng: number, accuracy: number | null, tripId: string | null) {
  db.runSync(
    'INSERT INTO gps_buffer (lat, lng, accuracy_m, trip_id, recorded_at) VALUES (?, ?, ?, ?, ?)',
    [lat, lng, accuracy, tripId, Date.now()]
  );
  // Keep buffer at 60 entries max
  db.runSync('DELETE FROM gps_buffer WHERE synced = 0 AND id NOT IN (SELECT id FROM gps_buffer ORDER BY id DESC LIMIT 60)');
}

export function getPendingGps() {
  return db.getAllSync<any>('SELECT * FROM gps_buffer WHERE synced = 0 ORDER BY id');
}

export function markGpsSynced(ids: number[]) {
  if (!ids.length) return;
  db.runSync(`UPDATE gps_buffer SET synced = 1 WHERE id IN (${ids.join(',')})`, []);
}

export { db };
