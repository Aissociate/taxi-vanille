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

export const LINE_DIR: Record<string, {am:string;pm:string;route:string}> = {
  L3:  { am:'→ Passot La Barge', pm:'→ Doujani',    route:'Doujani ↔ Passot Barge' },
  L4:  { am:'→ Passamainty',     pm:'→ Vahibe',      route:'Vahibe ↔ PEM Passamainty' },
  CHM: { am:'→ La Barge',        pm:'→ CHM',         route:'CHM ↔ La Barge · 13 arrêts' },
};

export const HOURS = Array.from({length:18},(_,i)=>i+4);
export const DAYS = ['Lun 4','Mar 5','Mer 6','Jeu 7','Ven 8','Sam 9','Dim 10'];
export const GANTT_START = 4, GANTT_SPAN = 18;

export const kindColor: Record<string,string> = {
  replace:'var(--brand)',add:'var(--success)',remove:'var(--danger)',
  validate:'var(--stroke)',edit:'var(--info)',system:'var(--stroke3)',
  incident:'#dc2626', resolve:'var(--success)',
};

export const TODAY_DOC = new Date('2026-05-08');
