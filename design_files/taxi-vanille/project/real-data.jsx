// real-data.jsx — données extraites des fichiers Excel fournis (CHM, L3, L4, Dimanches)

// ─── Chauffeurs Ligne 4 (VAHIBE ↔ PASSAMAINTY) ───────────────────────────
const L4_DRIVERS = [
  { code: 'C1',  nom: 'EL ANZIZ',     prenom: 'Hamada',       tel: '0639 22 81 28', vehicule: 'TV1', secteur: 'Mamoudzou',   places: 9 },
  { code: 'C2',  nom: 'BINA HALADI',  prenom: 'Bina',         tel: '0639 06 05 82', vehicule: '—',   secteur: 'Sud',         places: 9 },
  { code: 'C3',  nom: 'ABDOU MINIHADJI', prenom: 'Hamada',    tel: '0639 65 03 93', vehicule: '—',   secteur: 'Centre Sud',  places: 9 },
  { code: 'C4',  nom: 'TOUMBOU',      prenom: 'Toibrane',     tel: '0639 19 14 22', vehicule: '—',   secteur: 'Mamoudzou',   places: 9 },
  { code: 'C5',  nom: 'AHAMADI BACAR',prenom: 'Raenmouddine', tel: '—',             vehicule: '—',   secteur: 'Sud',         places: 9 },
  { code: 'C6',  nom: 'OUSSENI',      prenom: 'Soula',        tel: '0639 69 03 87', vehicule: '—',   secteur: 'Centre Nord', places: 9 },
  { code: 'C7',  nom: 'HAMIDOU',      prenom: 'Dahalani',     tel: '—',             vehicule: '—',   secteur: 'Mamoudzou',   places: 9 },
  { code: 'C8',  nom: 'HADHURAMI',    prenom: 'Makinedine',   tel: '0639 94 46 40', vehicule: '—',   secteur: 'Sud',         places: 9 },
  { code: 'C10', nom: 'ADINANI',      prenom: 'Zoubert',      tel: '0639 25 77 76', vehicule: 'TV5', secteur: 'Mamoudzou',   places: 9 },
  { code: 'C14', nom: 'MANSOUR',      prenom: 'Kamardine',    tel: '0639 21 15 43', vehicule: 'TV6', secteur: 'Nord',        places: 9 },
];

// ─── Chauffeurs Ligne 3 (DOUJANI ↔ PASSOT BARGE) ─────────────────────────
const L3_DRIVERS = [
  { code: 'D1',  nom: 'MOHAMED Ali',     prenom: '(laglace)',  tel: '06 39 40 35 35', vehicule: 'TV1', secteur: 'Mamoudzou',   type: 'Journée' },
  { code: 'D2',  nom: 'BARAKA',          prenom: 'Soumaila',    tel: '0639 24 71 32',  vehicule: '—',   secteur: 'Mamoudzou',   type: 'Journée' },
  { code: 'D3',  nom: 'ABDOURAHIM',      prenom: 'Mohamed',     tel: '06 39 67 24 24', vehicule: '—',   secteur: 'Sud',         type: 'Journée' },
  { code: 'D4',  nom: 'AMBDI',           prenom: 'Houmadi',     tel: '0639 23 55 69',  vehicule: 'TV2', secteur: 'Sud',         type: 'Journée' },
  { code: 'D5',  nom: 'AMINA',           prenom: 'Selemani',    tel: '06 93 32 32 68', vehicule: 'TV3', secteur: 'Mamoudzou',   type: 'Journée' },
  { code: 'D6',  nom: 'ABDOU HAMIDOUNE', prenom: 'Nassabia',    tel: '0639 23 54 34',  vehicule: '—',   secteur: 'Mamoudzou',   type: 'Journée' },
  { code: 'D7',  nom: 'COMBO',           prenom: 'Said',        tel: '0639 68 37 93',  vehicule: 'TV6', secteur: 'Mamoudzou',   type: 'Journée' },
  { code: 'D8',  nom: 'ISSOUF',          prenom: 'Dailami',     tel: '06 39 40 54 45', vehicule: '—',   secteur: 'Sud',         type: 'Journée' },
  { code: 'D10', nom: 'KAMARDINE',       prenom: 'Mansour (Salarié)', tel: '06 39 21 15 43', vehicule: 'WW-688-KR', secteur: 'Nord', type: 'Journée' },
  { code: 'D11', nom: 'ALLAOUI',         prenom: 'Soibrane',    tel: '06 39 99 08 35', vehicule: '—',   secteur: 'Centre Sud',  type: 'Journée' },
  { code: 'D12', nom: "VELOU M'COLO",    prenom: "M'Berou",     tel: '06 39 27 46 76', vehicule: 'TV4', secteur: 'Nord',        type: 'Trajet' },
  { code: 'D13', nom: 'MOURIDI',         prenom: 'Aktoir',      tel: '06 39 03 27 63', vehicule: 'TV7', secteur: 'Mamoudzou',   type: 'Trajet' },
  { code: 'D14', nom: 'AHAMADI',         prenom: 'Laydine',     tel: '06 39 58 51 87', vehicule: 'WW-620-KR', secteur: 'Mamoudzou', type: 'Trajet' },
];

// ─── Horaires Ligne 3 — semaine matin (extrait du PLANNING GENERAL) ──────
const L3_WEEK_AM = [
  { dep: 'DOUJANI',         h: '5:00', code: 'D1',  nom: 'MOHAMED Ali (laglace)',          astreinte: 'D14' },
  { dep: 'DOUJANI',         h: '5:10', code: 'D12', nom: "VELOU M'COLO M'Berou",            astreinte: 'D14' },
  { dep: 'DOUJANI',         h: '5:20', code: 'D5',  nom: 'AMINA Selemani',                  astreinte: 'D14' },
  { dep: 'DOUJANI',         h: '5:30', code: 'D13', nom: 'MOURIDI Aktoir',                  astreinte: 'D14' },
  { dep: 'PASSOT LA BARGE', h: '5:30', code: 'D1',  nom: 'MOHAMED Ali (laglace)',           astreinte: 'D14' },
  { dep: 'DOUJANI',         h: '5:40', code: 'D3',  nom: 'ABDOURAHIM Mohamed',              astreinte: 'D14' },
  { dep: 'PASSOT LA BARGE', h: '5:40', code: 'D12', nom: "VELOU M'COLO M'Berou",            astreinte: 'D14' },
  { dep: 'DOUJANI',         h: '5:50', code: 'D10', nom: 'KAMARDINE Mansour (Salarié)' },
  { dep: 'PASSOT LA BARGE', h: '5:50', code: 'D5',  nom: 'AMINA Selemani' },
  { dep: 'DOUJANI',         h: '6:00', code: 'D1',  nom: 'MOHAMED Ali (laglace)' },
  { dep: 'PASSOT LA BARGE', h: '6:00', code: 'D13', nom: 'MOURIDI Aktoir' },
  { dep: "M'TSAPERE",       h: '6:00', code: 'D4',  nom: 'AMBDI Houmadi' },
  { dep: 'PASSOT LA BARGE', h: '6:00', code: 'D11', nom: 'ALLAOUI Soibrane' },
  { dep: 'DOUJANI',         h: '6:10', code: 'D12', nom: "VELOU M'COLO M'Berou" },
  { dep: 'PASSOT LA BARGE', h: '6:10', code: 'D3',  nom: 'ABDOURAHIM Mohamed' },
  { dep: "M'TSAPERE",       h: '6:10', code: 'D5',  nom: 'AMINA Selemani' },
  { dep: 'PASSOT LA BARGE', h: '6:10', code: 'D14', nom: 'AHAMADI Laydine' },
];

// ─── Planning général Ligne 3 (plages horaires par chauffeur) ────────────
const L3_PLANNING_AM_RANGES = [
  { code: 'D1',  range: '5:00-8:30',   pm: '14:40-18:10' },
  { code: 'D2',  range: '6:20-14:50' },
  { code: 'D3',  range: '5:40-8:10',   pm: '14:40-18:10' },
  { code: 'D4',  range: '6:00-14:00' },
  { code: 'D5',  range: '5:20-8:10',   pm: '15:20-17:50' },
  { code: 'D6',  range: '6:20-8:20',   pm: '15:00-20:30' },
  { code: 'D7',  range: '6:20-8:20',   pm: '17:50-20:50' },
  { code: 'D8',  pm: '14:20-21:10' },
  { code: 'D10', pm: '15:20-21:30' },
  { code: 'D11', range: '5:50-14:10' },
  { code: 'D12', range: '6:00-13:50' },
  { code: 'D13', range: '5:10-8:10' },
  { code: 'D14', range: '5:30-8:30' },
  { code: 'D15', range: '6:10-8:10', note: 'Astreinte' },
];

const L4_PLANNING_RANGES = [
  { code: 'C1',  am: '4:30-12:45',                                 vehicule: 'TV1' },
  { code: 'C2',  am: '4:30-8:40',  pm: '13:00-16:00' },
  { code: 'C3',  am: '4:50-8:30',  pm: '14:30-17:00' },
  { code: 'C4',  am: '5:00-8:30',  pm: '19:00-20:45',  note: 'Astreinte 17:00-19:00' },
  { code: 'C5',  am: '6:00-9:30',  pm: '17:00-21:15' },
  { code: 'C6',  am: '6:30-14:15' },
  { code: 'C7',  am: '4:30-11:00', note: 'Astreinte 4:30-6:40 et 9:00-11:00' },
  { code: 'C8',  am: '5:10-8:45' },
  { code: 'C10', am: '5:20-8:00' },
  { code: 'C14', am: '5:30-8:10' },
];

// ─── Répartition dimanches & jours fériés ────────────────────────────────
const DIMANCHE_PLANNING = [
  { date: 'Dim 03 Mai 2026',  type: 'Dimanche',     l4Matin: 'C5 RAENMOUDDINE',  l4PM: 'C8 HADHURAMI',  l3Matin: 'D7 / D12',       l3PM: 'D8 / D14' },
  { date: 'Ven 08 Mai 2026',  type: 'Armistice',    l4Matin: 'C10 M\'CHANGAMA',  l4PM: 'C14 MANSOUR',   l3Matin: 'D7 / D12',       l3PM: 'D13 / D14' },
  { date: 'Dim 10 Mai 2026',  type: 'Dimanche',     l4Matin: 'C5 RAENMOUDDINE',  l4PM: 'C8 HADHURAMI',  l3Matin: 'D7 / D12',       l3PM: 'D8 / D14' },
  { date: 'Jeu 14 Mai 2026',  type: 'Ascension',    l4Matin: 'C10 M\'CHANGAMA',  l4PM: 'C14 MANSOUR',   l3Matin: 'D7 / D12',       l3PM: 'D13 / D14' },
  { date: 'Dim 17 Mai 2026',  type: 'Dimanche',     l4Matin: 'C5 RAENMOUDDINE',  l4PM: 'C8 HADHURAMI',  l3Matin: 'D7 / D12',       l3PM: 'D8 / D14' },
  { date: 'Dim 24 Mai 2026',  type: 'Pentecôte',    l4Matin: 'C10 M\'CHANGAMA',  l4PM: 'C14 MANSOUR',   l3Matin: 'D7 / D12',       l3PM: 'D13 / D14' },
  { date: 'Dim 31 Mai 2026',  type: 'Dimanche',     l4Matin: 'C5 RAENMOUDDINE',  l4PM: 'C8 HADHURAMI',  l3Matin: 'D7 / D12',       l3PM: 'D8 / D14' },
];

// ─── Stats type CADEMA / L4 (modèle PDF MARS 2026) ───────────────────────
const STATS_CLIENT = {
  client: 'CADEMA',
  ligne: 'Ligne 4 — Caribus',
  periode: 'Mars 2026',
  trajets: { theoriques: 642, effectues: 618, nonEffectues: 24, tauxRealisation: 96.3 },
  retards: { plus10mn: 18, ponctualite: 94.2 },
  voyageurs: { total: 8412, moyenneJour: 271, parTrajet: 13.6 },
  parChauffeur: [
    { code: 'C1',  nom: 'EL ANZIZE Hamada',         trajets: 84, retards: 2, vy: 1148 },
    { code: 'C5',  nom: 'AHAMADI Raenmouddine',     trajets: 72, retards: 1, vy: 982 },
    { code: 'C8',  nom: 'HADHURAMI Makinedine',     trajets: 78, retards: 4, vy: 1056 },
    { code: 'C14', nom: 'MANSOUR Kamardine',        trajets: 81, retards: 3, vy: 1102 },
    { code: 'C10', nom: 'ADINANI Zoubert',          trajets: 65, retards: 2, vy: 884 },
    { code: 'C6',  nom: 'OUSSENI Soula',            trajets: 70, retards: 5, vy: 942 },
    { code: 'C2',  nom: 'BINA HALADI Bina',         trajets: 58, retards: 1, vy: 798 },
    { code: 'C3',  nom: 'ABDOU MINIHADJI Hamada',   trajets: 54, retards: 2, vy: 712 },
    { code: 'C4',  nom: 'TOUMBOU Toibrane',         trajets: 56, retards: 4, vy: 788 },
  ],
  arrets: ['VAHIBE', 'TSOUNDZOU 1', 'TSOUNDZOU 2', 'PEM PASSAMAINTY'],
};

// ─── Lignes / Clients ────────────────────────────────────────────────────
const CLIENTS = [
  { code: 'CADEMA-L3', nom: 'CADEMA',  ligne: 'Ligne 3 — Doujani ↔ Passot Barge', drivers: 13, statut: 'AO' },
  { code: 'CADEMA-L4', nom: 'CADEMA',  ligne: 'Ligne 4 — Vahibe ↔ Passamainty',   drivers: 10, statut: 'AO' },
  { code: 'CHM',       nom: 'CHM',     ligne: 'CHM Petite-Terre',                 drivers: 6,  statut: 'Marché' },
];

// ─── Stats CHM Petite-Terre (lignes du Horaire détaillé) ─────────────────
const CHM_HORAIRES = [
  { sens: 'CHM → Barge',         h: '5:35', chauffeur: 'H1', direct: false },
  { sens: 'Barge → CHM',         h: '6:10', chauffeur: 'H5', direct: false },
  { sens: 'CHM → Barge',         h: '6:00', chauffeur: 'H3', direct: false },
  { sens: 'CHM → Barge',         h: '6:30', chauffeur: 'H1', direct: false },
  { sens: 'Barge → CHM + CRA',   h: '6:43', chauffeur: 'H3+H5', direct: true },
  { sens: 'CHM → Barge',         h: '6:55', chauffeur: 'H1+H5', direct: true },
  { sens: 'Barge → CHM + CRA',   h: '7:18', chauffeur: 'H3', direct: true },
  { sens: 'Barge → CHM',         h: '7:43', chauffeur: 'H5', direct: true },
];

// Export to global scope
Object.assign(window, {
  L4_DRIVERS, L3_DRIVERS,
  L3_WEEK_AM, L3_PLANNING_AM_RANGES, L4_PLANNING_RANGES,
  DIMANCHE_PLANNING, STATS_CLIENT, CLIENTS, CHM_HORAIRES,
});
