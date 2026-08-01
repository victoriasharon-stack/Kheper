function generateCase(difficulty){
  const counts = {easy:4, medium:6, hard:8, expert:8}[difficulty];
  const estate = pick(ESTATE_NAMES);
  const room = pick(ROOMS);
  const weapon = pick(WEAPONS);
  const murderTime = pick(["9:10 PM","9:40 PM","10:05 PM","10:30 PM","11:15 PM"]);
  const discoveryTime = pick(["11:00 PM","11:30 PM","12:15 AM","12:45 AM"]);

  const victimGender = pick(["f","m"]);
  const victimFirst = victimGender==="f" ? pick(NAMES_F) : pick(NAMES_M);
  const victimLast = pick(SURNAMES);
  const victim = { name: `${victimFirst} ${victimLast}`, occupation: pick(OCCUPATIONS) };

  const usedNames = new Set([victim.name]);
  function freshName(){
    let n;
    do{
      const g = pick(["f","m"]);
      n = `${g==="f"?pick(NAMES_F):pick(NAMES_M)} ${pick(SURNAMES)}`;
    } while(usedNames.has(n));
    usedNames.add(n);
    return n;
  }

  const relationsUsed = pickN(RELATIONS, counts);
  const motivesUsed = pickN(MOTIVE_TEMPLATES, counts);
  const secretsUsed = pickN(SECRET_TEMPLATES, counts);
  const personalitiesUsed = pickN(PERSONALITIES, counts);
  const roomsForAlibi = shuffle(ROOMS.filter(r=>r!==room));
  const staffPool = shuffle(STAFF_NAMES);

  const suspects = [];
  for(let i=0;i<counts;i++){
    suspects.push({
      id: uid('sus'),
      name: freshName(),
      occupation: pick(OCCUPATIONS),
      personality: personalitiesUsed[i].name,
      tone: personalitiesUsed[i].tone,
      relationship: relationsUsed[i],
      motive: motivesUsed[i].replace(/{victim}/g, victim.name),
      secret: secretsUsed[i],
      hasMotive: true,
      isMurderer: false,
      talked: false,
      alibiLocation: roomsForAlibi[i % roomsForAlibi.length],
    });
  }

  const murderer = pick(suspects);
  murderer.isMurderer = true;

  const innocents = suspects.filter(s=>!s.isMurderer);
  const shuffledInnocents = shuffle(innocents);
  for(let i=0;i<shuffledInnocents.length;i++){
    const s = shuffledInnocents[i];
    if(s.alibiCorroborator) continue;
    const useStaff = Math.random() < 0.4 || i === shuffledInnocents.length-1;
    if(useStaff){
      s.alibiCorroborator = { type:'staff', name: pick(staffPool) };
    } else {
      const partner = shuffledInnocents[i+1];
      if(partner && !partner.alibiCorroborator){
        s.alibiCorroborator = { type:'suspect', id: partner.id, name: partner.name };
        partner.alibiCorroborator = { type:'suspect', id: s.id, name: s.name };
      } else {
        s.alibiCorroborator = { type:'staff', name: pick(staffPool) };
      }
    }
  }

  const lieStrategy = pick(['deny_by_named','deny_by_staff','camera_contradiction']);
  let murdererLieDetail = "";
  if(lieStrategy === 'deny_by_named' && innocents.length){
    const falseWitness = pick(innocents);
    murderer.alibiCorroborator = { type:'suspect', id: falseWitness.id, name: falseWitness.name, falseClaim:true };
    murdererLieDetail = `${murderer.name} claims to have been with ${falseWitness.name} in ${murderer.alibiLocation} at the time of the murder — but ${falseWitness.name} will truthfully state they were nowhere near ${murderer.name} then.`;
  } else if(lieStrategy === 'deny_by_staff'){
    const staff = pick(staffPool);
    murderer.alibiCorroborator = { type:'staff', name: staff, falseClaim:true };
    murdererLieDetail = `${murderer.name} claims ${staff} saw them in ${murderer.alibiLocation} — but ${staff}'s actual account places them somewhere else entirely at that hour.`;
  } else {
    murderer.alibiCorroborator = { type:'none', falseClaim:true };
    murdererLieDetail = `${murderer.name} claims to have been alone in ${murderer.alibiLocation}, with no one to confirm it.`;
  }

  const evidence = [];
  function addEvidence(e){ evidence.push({ id: uid('ev'), discovered:false, ...e }); }

  addEvidence({
    category:'physical', title:'Cause of Death',
    desc:`The medical examiner confirms ${victim.name} died from a wound consistent with ${weapon}, in ${room}, around ${murderTime}.`,
    core:true
  });
  addEvidence({
    category:'physical', title:'The Murder Weapon',
    desc:`${weapon[0].toUpperCase()+weapon.slice(1)} is recovered near the body, hastily wiped down but not thoroughly cleaned.`,
    core:true
  });

  const placementFlavors = [
    `A partial shoe impression in ${room} matches the distinctive sole pattern of shoes ${murderer.name} was wearing that night.`,
    `A torn thread caught on the doorframe of ${room} matches a tear later noticed in ${murderer.name}'s jacket.`,
    `The estate's entry log shows a keycard registered to ${murderer.name} was used to access ${room} at ${murderTime}, contradicting their stated location.`,
    `A guest recalls glimpsing ${murderer.name} near ${room} shortly before ${murderTime}, though they didn't think much of it at the time.`,
    `${murderer.name}'s phone pinged the estate's private WiFi router nearest ${room} at ${murderTime}, not near ${murderer.alibiLocation} as claimed.`
  ];
  pickN(placementFlavors, 2).forEach(desc=>{
    addEvidence({ category:'forensic', title:'Placement at the Scene', desc, core:true, points:'murderer' });
  });

  if(lieStrategy === 'deny_by_named'){
    const falseWitness = suspects.find(s=>s.id===murderer.alibiCorroborator.id);
    addEvidence({
      category:'testimony', title:`${falseWitness.name}'s Real Account`,
      desc:`When asked directly, ${falseWitness.name} states plainly they were nowhere near ${murderer.name} around ${murderTime}, and were in fact in ${falseWitness.alibiLocation}. This directly contradicts ${murderer.name}'s claim.`,
      core:true, points:'murderer', unlockedBy:falseWitness.id
    });
  } else if(lieStrategy === 'deny_by_staff'){
    addEvidence({
      category:'testimony', title:`${murderer.alibiCorroborator.name.split(',')[0]}'s Statement`,
      desc:`${murderer.alibiCorroborator.name} reports seeing no one matching ${murderer.name}'s description in ${murderer.alibiLocation} during the murder window — directly contradicting ${murderer.name}'s claimed alibi.`,
      core:true, points:'murderer'
    });
  } else {
    addEvidence({
      category:'physical', title:'No Corroboration',
      desc:`No member of staff or any guest can place ${murderer.name} in ${murderer.alibiLocation} during the murder window. Their alibi is entirely uncorroborated.`,
      core:true, points:'murderer'
    });
  }

  addEvidence({
    category:'document', title:`A Reason to Want ${victim.name} Gone`,
    desc:`Records confirm ${murderer.name} ${murderer.motive}.`,
    points:'murderer'
  });

  innocents.forEach(s=>{
    const c = s.alibiCorroborator;
    let desc;
    if(c.type==='staff'){
      desc = `${c.name} confirms seeing ${s.name} in ${s.alibiLocation} throughout the murder window.`;
    } else {
      const partner = suspects.find(x=>x.id===c.id);
      desc = `${s.name} and ${partner ? partner.name : c.name} independently confirm they were together in ${s.alibiLocation} at the time of the murder.`;
    }
    addEvidence({ category:'testimony', title:`${s.name}'s Alibi`, desc, points:'clear:'+s.id, unlockedBy:s.id });
  });

  pickN(innocents, Math.min(innocents.length, difficulty==='expert'?5:3)).forEach(s=>{
    addEvidence({
      category:'document', title:`Something ${s.name} Would Rather Hide`,
      desc: Math.random()<0.5
        ? `Records suggest ${s.name} ${s.motive} — a clear reason to resent ${victim.name}, though it proves nothing about ${murderTime}.`
        : `It comes to light that ${s.name} ${s.secret}. Suspicious, but unrelated to the murder itself.`,
      points:'herring'
    });
  });

  const timeline = [
    { time:'7:00 PM', text:`Guests begin arriving at ${estate} for the evening.` },
    { time:'8:15 PM', text:`Dinner is served; several guests recall tension at the table involving ${victim.name}.` },
    { time:'8:50 PM', text:`${victim.name} is last seen alive, heading toward ${room}.` },
    { time: murderTime, text:`Estimated time of death — ${victim.name} is killed in ${room}.` },
    { time: discoveryTime, text:`${victim.name}'s body is discovered by a guest returning from the terrace.` },
  ];

  const c = {
    id: uid('case'),
    difficulty,
    estate, room, weapon, murderTime, discoveryTime,
    victim, suspects, evidence, timeline,
    murdererId: murderer.id,
    solved:false,
    wrongAccusations:0,
    boardLinks: [],
    boardPositions: {},
  };
  return c;
}