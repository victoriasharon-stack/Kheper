/* ---------------------------- APP STATE ---------------------------- */
const state = {
  screen:'start',            // start | game | 
  difficulty:'medium',
  activeTab:'overview',
  activeSuspectId:null,
  dialogueLog:{},             // suspectId -> [{who,text}]
  case:null,
  profile:{ rank:'Rookie', totalScore:0, casesSolved:0, casesPlayed:0 },
  boardMode:'move',           // move | link | contradict | erase
  boardSelection:null,
  dragging:null,
};

const RANKS = [
  {min:0, label:'Rookie'},
  {min:30, label:'Inspector'},
  {min:45, label:'Detective'},
  {min:60, label:'Senior Detective'},
  {min:75, label:'Chief Investigator'},
  {min:90, label:'Master Detective'},
];
function rankForScore(avg){
  let r = RANKS[0].label;
  for(const tier of RANKS){ if(avg>=tier.min) r=tier.label; }
  return r;
}

/* ---------------------------- PERSISTENCE ---------------------------- */
/* Uses plain browser localStorage — works when this file is opened
   directly or served locally, no backend required. */
function loadProfile(){
  try{
    const raw = localStorage.getItem('kheper_profile');
    if(raw){
      const p = JSON.parse(raw);
      state.profile = { ...state.profile, ...p };
    }
  }catch(e){ console.warn('No saved profile yet, or storage unavailable.', e); }
  renderRankChip();
}
function saveProfile(){
  try{
    localStorage.setItem('kheper_profile', JSON.stringify(state.profile));
  }catch(e){ console.error('Could not save detective profile', e); }
}

/* ---------------------------- TOASTS ---------------------------- */
function toast(msg, tone){
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast' + (tone==='crimson' ? ' crimson' : '');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 3600);
}