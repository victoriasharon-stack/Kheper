/* =========================================================================
   KHEPER — procedural mystery engine + dossier-dashboard UI
   Single-file implementation. Sections: DATA POOLS, GENERATOR, STATE,
   RENDERERS, INTERACTIONS, PERSISTENCE.
   ========================================================================= */

/* ---------------------------- RNG helpers ---------------------------- */
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function pickN(arr,n){
  const pool=[...arr]; const out=[];
  n=Math.min(n,pool.length);
  for(let i=0;i<n;i++){ const idx=Math.floor(Math.random()*pool.length); out.push(pool.splice(idx,1)[0]); }
  return out;
}
function shuffle(arr){ return pickN(arr,arr.length); }
function uid(prefix){ return prefix+'_'+Math.random().toString(36).slice(2,9); }

/* ---------------------------- DATA POOLS ---------------------------- */
const NAMES_F = ["Elena","Priya","Naomi","Sofia","Camille","Rina","Delphine","Amara","Vivienne","Yuki","Farah","Ingrid"];
const NAMES_M = ["Marcus","Devan","Julian","Rahul","Otto","Idris","Nathaniel","Kenji","Théo","Amos","Callum","Ezra"];
const SURNAMES = ["Ashford","Voss","Kapoor","Renwick","Delacroix","Okafor","Marchetti","Solberg","Whitfield","Nakamura","Byrne","Castellan","Moreau","Alderidge","Petrov","Kimura"];

const OCCUPATIONS = ["gallery curator","estate lawyer","private chef","antiques dealer","chief financial officer","stage magician","vintner","architect","journalist","physician","auction house director","biographer","yacht captain","horticulturist","jewel appraiser","chess champion"];

const PERSONALITIES = [
  {name:"nervous", tone:"nervous"},
  {name:"arrogant", tone:"cold"},
  {name:"charming", tone:"charming"},
  {name:"blunt", tone:"blunt"},
  {name:"meticulous", tone:"blunt"},
  {name:"evasive", tone:"nervous"},
  {name:"grieving", tone:"nervous"},
  {name:"cold and composed", tone:"cold"},
  {name:"flirtatious", tone:"charming"},
  {name:"paranoid", tone:"nervous"},
  {name:"jovial", tone:"charming"},
  {name:"defensive", tone:"blunt"},
];

const RELATIONS = [
  "the victim's business partner","the victim's estranged sibling","the victim's former lover",
  "the victim's personal assistant","a longtime rival","the victim's stepchild",
  "the victim's creditor","a close friend since university","the victim's protégé",
  "the victim's second spouse","a disgruntled former employee","the family's live-in physician"
];

const MOTIVE_TEMPLATES = [
  "stood to inherit a controlling share of {victim}'s estate",
  "was being quietly written out of {victim}'s will",
  "owed {victim} a debt that {victim} threatened to call in publicly",
  "was being blackmailed by {victim} over a past indiscretion",
  "had discovered {victim} was about to expose a professional fraud",
  "was in a bitter custody dispute that {victim} controlled the outcome of",
  "had been humiliated by {victim} in front of investors weeks earlier",
  "believed {victim} sabotaged their career out of jealousy",
  "was secretly in love with {victim}'s spouse",
  "had forged documents that {victim} was threatening to reveal",
  "lost a fortune trusting a deal {victim} had promised and reneged on",
  "was about to be replaced by {victim} in the family business"
];

const SECRET_TEMPLATES = [
  "has a gambling debt they've hidden from everyone at the estate",
  "was having a secret affair with another guest",
  "forged a signature on an old contract, unrelated to the murder",
  "has been quietly selling off family heirlooms",
  "lied about their professional credentials years ago",
  "was fired from a previous position for embezzlement, never disclosed",
  "has a criminal record from decades ago, long sealed",
  "was seen leaving the estate at an odd hour for an unrelated tryst",
  "has been impersonating a title they don't legally hold",
  "owes money to a person connected to organized crime"
];

const ROOMS = ["the library","the wine cellar","the conservatory","the east wing study","the boathouse","the rooftop terrace","the billiards room","the walled garden","the kitchen pantry","the guest wing hallway","the music room","the greenhouse"];

const WEAPONS = ["a bronze letter opener","a heavy candlestick","a length of garden wire","a ceremonial dagger","a hand-carved chess piece","a fall from the terrace railing","a vial of poisoned brandy","a fireplace poker","a antique dueling pistol","a silk scarf"];

const ESTATE_NAMES = ["Ashcombe Manor","the Villa Serrano","Thornleigh Hall","the Kestrel Estate","Blackmere House","the Whitlock Residence","Ravensdown Manor","the Solari Villa"];

const STAFF_NAMES = ["Mrs. Halloway the housekeeper","Denis the groundskeeper","the night butler, Osei","Miss Vane the events coordinator","the security guard, Farrow"];

const CONFRONT_TONES = {
  nervous:["visibly stiffens","laughs a beat too late","avoids eye contact","fidgets with their sleeve"],
  cold:["barely reacts","lets out a thin, controlled smile","stares back evenly, unreadable"],
  charming:["deflects with a joke","leans back, smiling too easily","tries to change the subject smoothly"],
  blunt:["scowls and crosses their arms","snaps back defensively","answers curtly, clearly irritated"]
};