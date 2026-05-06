export interface Driver {
  code: string;
  nom: string;
  tel?: string;
  vehicule?: string;
  am?: string;
  pm?: string;
  astr?: string;
  dimJF?: string;
}

export const L3: Driver[] = [
  { code:'D1',  nom:'MOHAMED Ali',             tel:'06 39 40 35 35', vehicule:'GR-558-LA', am:'5:00-8:30',   pm:'14:40-18:10' },
  { code:'D2',  nom:'BARAKA Soumaila',          tel:'06 39 24 71 32', vehicule:'GX-284-BV', am:'6:20-14:50' },
  { code:'D3',  nom:'ABDOURAHIM Mohamed',       tel:'06 39 67 24 24', vehicule:'GY-732-PV', am:'5:40-8:10',   pm:'14:40-18:10' },
  { code:'D4',  nom:'AMBDI Houmadi',            tel:'06 39 23 55 69', vehicule:'GC-122-QA', am:'6:00-14:00' },
  { code:'D5',  nom:'AMINA Selemani',           tel:'06 93 32 32 68', vehicule:'WW-696-KR', am:'5:20-8:10',   pm:'15:20-17:50' },
  { code:'D6',  nom:'ABDOU HAMIDOUNE Nassabia', tel:'06 39 23 54 34', vehicule:'GY-652-NV', am:'6:20-8:20',   pm:'15:00-20:30' },
  { code:'D7',  nom:'COMBO Said',               tel:'06 39 68 37 93', vehicule:'GB-965-EQ', am:'6:20-8:20',   pm:'17:50-20:50', dimJF:'matin' },
  { code:'D8',  nom:'ISSOUF Dailami',           tel:'06 39 40 54 45', vehicule:'GZ-268-PR', pm:'14:20-21:10', dimJF:'PM 1/2' },
  { code:'D9',  nom:'RENEE Assanati',           tel:'06 39 07 82 51', vehicule:'GR-921-XZ', pm:'15:20-21:30' },
  { code:'D10', nom:'KAMARDINE Mansour',        tel:'06 39 21 15 43', vehicule:'WW-688-KR', am:'5:50-14:10' },
  { code:'D11', nom:'ALLAOUI Soibrane',         tel:'06 39 99 08 35', vehicule:'FZ-148-HW', am:'6:00-13:50' },
  { code:'D12', nom:"VELOU M'COLO M'Berou",     tel:'06 39 27 46 76', vehicule:'HC-814-HL', am:'5:10-8:10',   dimJF:'matin' },
  { code:'D13', nom:'MOURIDI Aktoir',           tel:'06 39 03 27 63', vehicule:'GY-978-QD', am:'5:30-8:30',   dimJF:'PM 1/2' },
  { code:'D14', nom:'AHAMADI Laydine',          tel:'06 39 58 51 87', vehicule:'WW-620-KR', am:'6:10-8:10',   astr:'4:30-6:00·8:10-11:00', dimJF:'PM fixe' },
];

export const L4: Driver[] = [
  { code:'C1',  nom:'EL ANZIZE Hamada',        tel:'06 39 22 81 28', vehicule:'GM-515-YL', am:'4:30-12:45' },
  { code:'C2',  nom:'BINA HALADI Bina',         tel:'06 39 06 05 82', vehicule:'WW-654-KR', am:'4:30-8:40',  pm:'13:00-16:00' },
  { code:'C3',  nom:'ABDOU MINIHADJI Amada',    tel:'06 39 65 03 93', vehicule:'FY-654-BF', am:'4:50-8:30',  pm:'14:30-17:00', astr:'17:00-19:00' },
  { code:'C4',  nom:'TOUMBOU Toibourani',       tel:'06 39 19 14 22', vehicule:'GF-215-AQ', am:'5:00-8:30',  pm:'17:00-21:15' },
  { code:'C5',  nom:'AHAMADI Raenmouddine',     tel:'06 39 02 40 54', vehicule:'HC-007-YA', am:'6:00-9:30',  dimJF:'matin 1/2' },
  { code:'C6',  nom:'OUSSENI Soula',            tel:'06 39 69 03 87', vehicule:'GP-813-HX', am:'6:30-14:15' },
  { code:'C7',  nom:'HAMIDOU Dahalani',         tel:'06 39 97 83 04', vehicule:'EB-387-HJ', am:'4:30-11:00', astr:'4:30-6:40·9:00-11:00' },
  { code:'C8',  nom:'HADHURAMI Makinedine',     tel:'06 39 94 46 40', vehicule:'FZ-411-ZD', am:'5:10-8:45',  dimJF:'PM 1/2' },
  { code:'C9',  nom:'SANDI Maanrouf',           tel:'06 39 40 58 85', vehicule:'GW-255-NY', am:'5:20-8:00' },
  { code:'C10', nom:"ISSIHAKA M'Changama",      tel:'06 39 27 71 41', vehicule:'GM-253-PW', am:'5:30-8:10',  dimJF:'matin 1/2' },
  { code:'C11', nom:'MADI BOINA Mkidachi',      tel:'06 39 22 08 67', vehicule:'GS-501-ZK', am:'5:00-8:30' },
  { code:'C12', nom:'ALILOIFFA Said Siradj',    tel:'06 39 39 15 17', vehicule:'GS-608-GG', am:'6:00-8:30' },
  { code:'C13', nom:'ABDALLAH Ben',             tel:'06 39 63 48 34', vehicule:'WW-661-KR', am:'6:30-9:00' },
  { code:'C14', nom:'KAMARDINE Mansour',        tel:'06 39 21 15 43', vehicule:'WW-629-KR', am:'6:40-8:10',  dimJF:'PM 1/2' },
];

export const CHM: Driver[] = [
  { code:'H1', nom:'CHADHOULI Houmadi',   tel:'06 39 02 29 70', vehicule:'GT-434-BT', am:'5:35-7:50', pm:'14:00-19:45' },
  { code:'H2', nom:'CHAMSSOUNE Ahmed',    tel:'06 39 95 35 45', vehicule:'DV-201-DH' },
  { code:'H3', nom:'SAID ALI Kamile',     tel:'06 39 22 01 83', vehicule:'EF-251-RR', am:'6:00-7:05', pm:'14:00-19:45' },
  { code:'H4', nom:'BACAR ALI Mohamed',   tel:'07 83 82 76 52', vehicule:'EE-142-DQ' },
  { code:'H5', nom:'ATTOUMANI Kamaldine', tel:'06 39 66 69 21', vehicule:'DG-106-XM', am:'5:45-7:50', pm:'15:00-19:25' },
  { code:'H6', nom:'MADI Hamada',         tel:'06 39 61 35 52', vehicule:'AD-649-QS' },
  { code:'H7', nom:'OIHABOU Bacari',      tel:'06 39 21 37 01', vehicule:'DX-651-JT' },
  { code:'H8', nom:'AHMED Abdallah',      tel:'06 39 22 39 00', vehicule:'AK-861-JF' },
];

export const LINE_DIR: Record<string, {am:string;pm:string;route:string}> = {
  L3:  { am:'→ Passot La Barge', pm:'→ Doujani',    route:'Doujani ↔ Passot Barge' },
  L4:  { am:'→ Passamainty',     pm:'→ Vahibe',      route:'Vahibe ↔ PEM Passamainty' },
  CHM: { am:'→ La Barge',        pm:'→ CHM',         route:'CHM ↔ La Barge · 13 arrêts' },
};

export const HOURS = Array.from({length:18},(_,i)=>i+4);
export const DAYS = ['Lun 4','Mar 5','Mer 6','Jeu 7','Ven 8','Sam 9','Dim 10'];
export const GANTT_START = 4, GANTT_SPAN = 18;

export const STATS = {
  trajets:{th:642,ef:618,non:24,taux:96.3},
  retards:{plus10:18,ponct:94.2},
  voy:{total:8412,moy:271,parTj:13.6},
  parCh:[
    {code:'C1', nom:'EL ANZIZE Hamada',       trajets:84,retards:2,vy:1148},
    {code:'C14',nom:'KAMARDINE Mansour',       trajets:81,retards:3,vy:1102},
    {code:'C8', nom:'HADHURAMI Makinedine',    trajets:78,retards:4,vy:1056},
    {code:'C5', nom:'AHAMADI Raenmouddine',    trajets:72,retards:1,vy:982},
    {code:'C10',nom:"ISSIHAKA M'Changama",     trajets:65,retards:2,vy:884},
    {code:'C6', nom:'OUSSENI Soula',           trajets:70,retards:5,vy:942},
  ],
};

export const INVOICES = [
  // REÇUE · À VALIDER — S19
  {id:'F2026-0146',driver:'C1 · EL ANZIZE Hamada',           week:'S19',amount:'1 850,00',status:'draft'},
  {id:'F2026-0147',driver:'C14 · KAMARDINE Mansour',         week:'S19',amount:'1 410,00',status:'draft'},
  {id:'F2026-0148',driver:'C8 · HADHURAMI Makinedine',       week:'S19',amount:'1 320,00',status:'draft'},
  {id:'F2026-0149',driver:'C5 · AHAMADI Raenmouddine',       week:'S19',amount:'1 180,00',status:'draft'},
  {id:'F2026-0150',driver:"C10 · ISSIHAKA M'Changama",       week:'S19',amount:'1 050,00',status:'draft'},
  {id:'F2026-0151',driver:'C6 · OUSSENI Soula',              week:'S19',amount:'1 120,00',status:'draft'},
  {id:'F2026-0152',driver:'D1 · MOHAMED Ali',                week:'S19',amount:'1 200,00',status:'draft'},
  {id:'F2026-0153',driver:'D3 · ABDOURAHIM Mohamed',         week:'S19',amount:'980,00', status:'draft'},
  // VALIDÉE · À PAYER — S18
  {id:'F2026-0144',driver:'D7 · COMBO Said',                 week:'S18',amount:'980,00', status:'validated'},
  {id:'F2026-0145',driver:"D12 · VELOU M'COLO M'Berou",      week:'S18',amount:'1 100,00',status:'validated'},
  {id:'F2026-0141',driver:'C7 · HAMIDOU Dahalani',           week:'S18',amount:'1 050,00',status:'validated'},
  // PAYÉE — S18 et antérieures
  {id:'F2026-0142',driver:'D1 · MOHAMED Ali',                week:'S18',amount:'1 240,00',status:'paid'},
  {id:'F2026-0143',driver:'D5 · AMINA Selemani',             week:'S18',amount:'1 380,50',status:'paid'},
  {id:'F2026-0138',driver:'C1 · EL ANZIZE Hamada',           week:'S17',amount:'1 820,00',status:'paid'},
  {id:'F2026-0139',driver:'C14 · KAMARDINE Mansour',         week:'S17',amount:'1 390,00',status:'paid'},
  {id:'F2026-0136',driver:'D5 · AMINA Selemani',             week:'S17',amount:'1 350,00',status:'paid'},
  {id:'F2026-0134',driver:'D1 · MOHAMED Ali',                week:'S16',amount:'1 210,00',status:'paid'},
  {id:'F2026-0133',driver:'C8 · HADHURAMI Makinedine',       week:'S16',amount:'1 290,00',status:'paid'},
  {id:'F2026-0130',driver:'C1 · EL ANZIZE Hamada',           week:'S15',amount:'1 800,00',status:'paid'},
  {id:'F2026-0129',driver:'D7 · COMBO Said',                 week:'S15',amount:'960,00', status:'paid'},
  {id:'F2026-0128',driver:'C14 · KAMARDINE Mansour',         week:'S15',amount:'1 380,00',status:'paid'},
  {id:'F2026-0127',driver:'D3 · ABDOURAHIM Mohamed',         week:'S14',amount:'950,00', status:'paid'},
  {id:'F2026-0126',driver:'D5 · AMINA Selemani',             week:'S14',amount:'1 320,00',status:'paid'},
];

export const AUDIT = [
  {day:"Aujourd'hui · vendredi 8 mai",items:[
    {t:'11:42',who:'M. Aubin · Direction',action:'Remplacement',target:'D1 → D5 · 14:40 Doujani',reason:'Panne véhicule',kind:'replace',notify:'✓ FCM D5 + D1'},
    {t:'11:14',who:'Y. Hamada · Coord. matin L3',action:'Course ajoutée',target:'D14 · 16:00 Passot Barge',reason:'Demande CADEMA',kind:'add'},
    {t:'09:02',who:'M. Aubin · Direction',action:'Annulation',target:'D7 · 10:00 Passot Barge',reason:'Route bloquée',kind:'remove',notify:'✓ FCM D7 + CADEMA'},
    {t:'08:31',who:'Système',action:'Notification reçue',target:'D7 · vocal incident',reason:'0:33 · transcription auto',kind:'system'},
  ]},
  {day:'Hier · jeudi 7 mai',items:[
    {t:'17:20',who:'M. Aubin · Direction',action:'Validation hebdo',target:'Planning S19 · L3 + L4',kind:'validate'},
    {t:'14:08',who:'M. Kamardine · Coord. PM L3',action:'Décalage horaire',target:'D5 · 5:20 → 5:40',reason:'Demande chauffeur',kind:'edit'},
    {t:'11:55',who:'M. Aubin · Direction',action:'Remplacement',target:'D12 → D14 · mardi 14:00',reason:'Congé maladie',kind:'replace',notify:'✓ FCM D14'},
  ]},
];
export const kindColor: Record<string,string> = {
  replace:'var(--brand)',add:'var(--success)',remove:'var(--danger)',
  validate:'var(--stroke)',edit:'var(--info)',system:'var(--stroke3)'
};

export const TODAY_DOC = new Date('2026-05-08');
export const DOCS: Record<string,any> = {
  D1:{p:{e:'2028-03-15'},m:{e:'2026-06-30'},a:{e:'2026-09-01'},c:{e:'2027-01-20'}},
  D2:{p:{e:'2026-11-08'},m:{e:'2026-07-22'},a:{e:'2026-09-01'},c:{e:'2027-06-15'}},
  D3:{p:{e:'2027-05-20'},m:{e:'2026-08-10'},a:{e:'2026-09-01'},c:{e:'2026-11-30'}},
  D5:{p:{e:'2027-09-08'},m:{e:'2026-07-01'},a:{e:'2026-09-01'},c:{e:'2027-04-10'}},
  D7:{p:{e:'2025-11-10'},m:{e:'2026-08-15'},a:{e:'2026-09-01'},c:{e:'2026-12-31'}},
  C1:{p:{e:'2027-11-02'},m:{e:'2026-07-30'},a:{e:'2026-09-01'},c:{e:'2027-03-15'}},
  C8:{p:{e:'2027-01-07'},m:{e:'2026-07-20'},a:{e:'2026-09-01'},c:{e:'2026-10-22'}},
  H1:{p:{e:'2027-03-20'},m:{e:'2026-06-30'},a:{e:'2026-09-01'},c:{e:'2027-02-14'}},
};
export const RIBS: Record<string,any> = {
  D1:{iban:'FR76 1027 8060 0000 1234 5678 901',bic:'CMCIFR2A',banque:'Crédit Mutuel',titulaire:'MOHAMED Ali'},
  D5:{iban:'FR76 3000 4000 0300 1122 3344 556',bic:'BNPAFRPP',banque:'BNP Paribas',titulaire:'AMINA Selemani'},
  C1:{iban:'FR76 1027 8060 0000 9900 1122 334',bic:'CMCIFR2A',banque:'Crédit Mutuel',titulaire:'EL ANZIZE Hamada'},
  H1:{iban:'FR76 1820 6004 4910 8877 6655 443',bic:'AGRIFRPP',banque:'Crédit Agricole',titulaire:'CHADHOULI Houmadi'},
};
