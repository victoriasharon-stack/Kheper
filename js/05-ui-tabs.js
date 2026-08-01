function renderOverview(c){
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="panel-head">
      <h2>Case Overview</h2>
      <div class="sub">${c.difficulty.toUpperCase()} · ${c.suspects.length} SUSPECTS</div>
    </div>
    <div class="dossier-header">
      <img class="dossier-photo" src="${portraitDataUri(c.victim.name, {redacted:true})}" alt="">
      <div class="dossier-meta">
        <div class="dossier-stamp">CLASSIFIED</div>
        <h3>${c.victim.name}</h3>
        <div class="dossier-role">${c.victim.occupation}</div>
        <div class="dossier-fields">
          <span><b>Location</b> ${c.estate}</span>
          <span><b>Time of death</b> ${c.murderTime}</span>
          <span><b>Scene</b> ${c.room}</span>
        </div>
      </div>
    </div>
    <div class="scene-brief">
      <b>${c.victim.name}</b>, ${c.victim.occupation}, was found dead at <b>${c.estate}</b>. The medical examiner places time of death around <b>${c.murderTime}</b> in <b>${c.room}</b>; the body was discovered around ${c.discoveryTime}. ${c.suspects.length} people were present on the estate that night, each with their own relationship to the victim — and, as you will find, each with something they'd rather you didn't know.
      <br><br>
      Your task: interview every suspect, examine the crime scene, cross-reference testimonies against the physical evidence, and identify whose alibi does not hold up. There is exactly one true culprit. Everything else may be true, false, or simply irrelevant — that is for you to determine.
    </div>
    <div class="card-grid">
      <div class="card">
        <div class="tagrow"><span class="tag gold">Progress</span></div>
        <h4 style="font-family:var(--font-display); font-weight:400; margin-bottom:8px;">Suspects interviewed</h4>
        <p style="color:var(--ink-dim); font-size:13px;">${c.suspects.filter(s=>s.talked).length} / ${c.suspects.length}</p>
      </div>
      <div class="card">
        <div class="tagrow"><span class="tag gold">Progress</span></div>
        <h4 style="font-family:var(--font-display); font-weight:400; margin-bottom:8px;">Evidence gathered</h4>
        <p style="color:var(--ink-dim); font-size:13px;">${c.evidence.filter(e=>e.discovered).length} / ${c.evidence.length}</p>
      </div>
      <div class="card">
        <div class="tagrow"><span class="tag crimson">Status</span></div>
        <h4 style="font-family:var(--font-display); font-weight:400; margin-bottom:8px;">Wrong accusations</h4>
        <p style="color:var(--ink-dim); font-size:13px;">${c.wrongAccusations}</p>
      </div>
    </div>
  `;
  return el;
}

function sceneClues(c){
  if(c._sceneClues) return c._sceneClues;
  const inspectables = c.evidence.filter(e=>e.category==='physical' || e.category==='forensic');
  const objLabels = ["Examine the body","Inspect the weapon","Check the doorframe","Dust for prints","Review the keycard log","Search the desk drawer","Check the window latch","Look under the rug"];
  const list = inspectables.map((e,i)=>({ evId:e.id, label: objLabels[i % objLabels.length] }));
  c._sceneClues = list;
  return list;
}
function renderScene(c){
  const el = document.createElement('div');
  const clues = sceneClues(c);
  el.innerHTML = `
    <div class="panel-head">
      <h2>Crime Scene — ${c.room}</h2>
      <div class="sub">${c.estate.toUpperCase()}</div>
    </div>
    <div class="scene-brief">The room has been cordoned off. ${c.weapon[0].toUpperCase()+c.weapon.slice(1)} lies near where the body was found. Investigators have marked several points of interest — inspect each carefully.</div>
    <div class="clue-list" id="clueList"></div>
  `;
  const listEl = el.querySelector('#clueList');
  clues.forEach(cl=>{
    const ev = c.evidence.find(e=>e.id===cl.evId);
    const row = document.createElement('div');
    row.className = 'clue-row' + (ev.discovered ? ' found' : '');
    row.innerHTML = `
      <div class="txt">${cl.label}<small>${ev.discovered ? ev.title : 'Undisturbed — click to examine'}</small></div>
      <button class="btn ghost" ${ev.discovered?'disabled':''}>${ev.discovered?'Logged':'Examine'}</button>
    `;
    row.querySelector('button').addEventListener('click', ()=>{
      ev.discovered = true;
      toast(`Evidence logged: ${ev.title}`);
      render();
    });
    listEl.appendChild(row);
  });
  return el;
}

function renderSuspects(c){
  const el = document.createElement('div');
  el.innerHTML = `<div class="panel-head"><h2>Suspects</h2><div class="sub">${c.suspects.length} PERSONS OF INTEREST</div></div>`;
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  c.suspects.forEach(s=>{
    const card = document.createElement('div');
    card.className = 'card suspect-card';
    card.innerHTML = `
      <img class="suspect-portrait" src="${portraitDataUri(s.name)}" alt="">
      <div class="tagrow">
        <span class="tag ${s.talked?'gold':''}">${s.talked ? 'Interviewed' : 'Not yet interviewed'}</span>
        <span class="tag">${s.personality}</span>
      </div>
      <h3>${s.name}</h3>
      <div class="role">${s.occupation}</div>
      <div class="meta">Relationship: ${s.relationship}<br>Claimed location: ${s.alibiLocation}</div>
      <button class="btn ghost">Open Interview →</button>
    `;
    card.querySelector('button').addEventListener('click', ()=>{
      state.activeTab='interview'; state.activeSuspectId=s.id; render();
    });
    grid.appendChild(card);
  });
  el.appendChild(grid);
  return el;
}

function pushLine(suspectId, who, text){
  if(!state.dialogueLog[suspectId]) state.dialogueLog[suspectId]=[];
  state.dialogueLog[suspectId].push({who, text});
}

function suspectOpeningLine(s, c){
  const toneOpeners = {
    nervous: `"I— I already told the others, I was in ${s.alibiLocation}. I don't understand why I need to keep repeating it."`,
    cold: `"I was in ${s.alibiLocation}. I trust that settles the matter."`,
    charming: `"Detective. Lovely to finally meet you properly. I was in ${s.alibiLocation}, if you must know."`,
    blunt: `"${s.alibiLocation}. That's where I was. Ask your questions."`
  };
  return toneOpeners[s.tone] || `"I was in ${s.alibiLocation}."`;
}

function askAlibi(s, c){
  let text;
  if(s.isMurderer){
    if(s.alibiCorroborator.type==='suspect'){
      text = `"${s.alibiCorroborator.name} can vouch for me. We were together in ${s.alibiLocation}, the whole time."`;
    } else if(s.alibiCorroborator.type==='staff'){
      text = `"${s.alibiCorroborator.name} saw me in ${s.alibiLocation}. Ask them, if you don't believe me."`;
    } else {
      text = `"I was alone in ${s.alibiLocation}. I know how that sounds, but it's the truth."`;
    }
  } else {
    if(s.alibiCorroborator.type==='suspect'){
      text = `"I was with ${s.alibiCorroborator.name}, in ${s.alibiLocation}, the entire time. You can ask them yourself."`;
    } else {
      text = `"${s.alibiCorroborator.name} saw me in ${s.alibiLocation}. I never left."`;
    }
  }
  return text;
}

function askRelationship(s, c){
  const toneFlavor = {
    nervous: `"We— we got along fine, mostly."`,
    cold: `"Our relationship is none of your concern."`,
    charming: `"Oh, we had our moments. Doesn't everyone?"`,
    blunt: `"We weren't close. I won't pretend otherwise."`
  };
  return `"${s.relationship[0].toUpperCase()+s.relationship.slice(1)}, if you want the formal answer." ${toneFlavor[s.tone]||''}`;
}

function askOthers(s, c){
  const others = c.suspects.filter(o=>o.id!==s.id);
  const target = pick(others);
  const options = [
    `"${target.name}? I'd keep an eye on them, honestly. They've been acting strange all evening."`,
    `"${target.name} seemed perfectly normal to me. Why, should I be worried?"`,
    `"I don't like to gossip, but ${target.name} and ${c.victim.name} argued at dinner. Everyone saw it."`,
    `"${target.name} keeps to themself. Hard to say what's really going on there."`
  ];
  return pick(options);
}

function presentEvidenceReaction(s, ev, c){
  const tones = CONFRONT_TONES[s.tone] || CONFRONT_TONES.blunt;
  const tell = pick(tones);
  if(ev.points === 'murderer' && s.isMurderer){
    return `${s.name} ${tell}. "I— that doesn't prove anything," they say, voice tight.`;
  }
  if(ev.unlockedBy === s.id){
    return `${s.name} nods. "Yes, that's right. That's exactly what happened."`;
  }
  if(String(ev.points||'').startsWith('clear:') && ev.points === 'clear:'+s.id){
    return `${s.name} relaxes slightly. "Good. Then you know I had nothing to do with it."`;
  }
  if(ev.points==='herring' && ev.desc.includes(s.name)){
    return `${s.name} ${tell}. "That's... private. It has nothing to do with the murder."`;
  }
  return `${s.name} shrugs. "I don't know anything about that."`;
}

function renderInterview(c){
  const el = document.createElement('div');
  el.innerHTML = `<div class="panel-head"><h2>Interview Room</h2><div class="sub">CHOOSE A SUSPECT</div></div>`;
  const grid = document.createElement('div');
  grid.className = 'interview-grid';

  const list = document.createElement('div');
  list.className = 'suspect-list-mini';
  c.suspects.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'mini-sus' + (state.activeSuspectId===s.id?' active':'') + (s.talked?' talked':'');
    row.innerHTML = `<span>${s.name}</span><span class="dot"></span>`;
    row.addEventListener('click', ()=>{ state.activeSuspectId=s.id; render(); });
    list.appendChild(row);
  });
  grid.appendChild(list);

  const box = document.createElement('div');
  box.className = 'dialogue-box';
  const s = c.suspects.find(x=>x.id===state.activeSuspectId) || c.suspects[0];
  if(!state.activeSuspectId) state.activeSuspectId = s.id;

  if(!state.dialogueLog[s.id]){
    pushLine(s.id, 'them', suspectOpeningLine(s,c));
    s.talked = true;
  }

  box.innerHTML = `
    <div class="dlg-head">
      <div style="display:flex; align-items:center; gap:16px;">
        <img class="dlg-portrait" src="${portraitDataUri(s.name)}" alt="">
        <div>
          <h3>${s.name}</h3>
          <div class="role">${s.occupation} · ${s.relationship}</div>
        </div>
      </div>
      <span class="tag">${s.personality}</span>
    </div>
    <div class="dlg-body" id="dlgBody"></div>
    <div class="dlg-options" id="dlgOptions"></div>
  `;
  const body = box.querySelector('#dlgBody');
  (state.dialogueLog[s.id]||[]).forEach(l=>{
    const line = document.createElement('div');
    line.className = 'line ' + (l.who==='you'?'you':'them');
    line.innerHTML = `<span class="who">${l.who==='you'?'YOU':s.name.toUpperCase()}</span>${l.text}`;
    body.appendChild(line);
  });

  const opts = box.querySelector('#dlgOptions');
  const questions = [
    {label:'Where were you at the time of the murder?', fn:()=>askAlibi(s,c)},
    {label:'What was your relationship with the victim?', fn:()=>askRelationship(s,c)},
    {label:'What do you make of the other guests?', fn:()=>askOthers(s,c)},
  ];
  questions.forEach(q=>{
    const b = document.createElement('button');
    b.className='qbtn';
    b.textContent = q.label;
    b.addEventListener('click', ()=>{
      pushLine(s.id,'you',`"${q.label}"`);
      pushLine(s.id,'them', q.fn());
      render();
      setTimeout(()=>{ const bd=document.querySelector('#dlgBody'); if(bd) bd.scrollTop=bd.scrollHeight; },0);
    });
    opts.appendChild(b);
  });

  const discovered = c.evidence.filter(e=>e.discovered);
  if(discovered.length){
    const presentLabel = document.createElement('div');
    presentLabel.style.cssText='width:100%; font-family:var(--font-mono); font-size:10px; letter-spacing:1.5px; color:var(--ink-faint); margin-top:8px; text-transform:uppercase;';
    presentLabel.textContent='Present evidence:';
    opts.appendChild(presentLabel);
    discovered.forEach(ev=>{
      const b = document.createElement('button');
      b.className='qbtn present';
      b.textContent = ev.title;
      b.addEventListener('click', ()=>{
        pushLine(s.id,'you',`I'd like you to explain this: "${ev.title}."`);
        pushLine(s.id,'them', presentEvidenceReaction(s,ev,c));
        render();
        setTimeout(()=>{ const bd=document.querySelector('#dlgBody'); if(bd) bd.scrollTop=bd.scrollHeight; },0);
      });
      opts.appendChild(b);
    });
  }

  grid.appendChild(box);
  el.appendChild(grid);
  return el;
}

function renderEvidenceLocker(c){
  const el = document.createElement('div');
  const found = c.evidence.filter(e=>e.discovered);
  el.innerHTML = `<div class="panel-head"><h2>Evidence Locker</h2><div class="sub">${found.length} / ${c.evidence.length} LOGGED</div></div>`;
  if(!found.length){
    const empty = document.createElement('div');
    empty.className='empty';
    empty.textContent='No evidence logged yet. Examine the crime scene and interview suspects to build your case.';
    el.appendChild(empty);
    return el;
  }
  const grid = document.createElement('div');
  grid.className='card-grid';
  found.forEach(ev=>{
    const card = document.createElement('div');
    card.className='card ev-card';
    card.innerHTML = `
      <img class="ev-icon" src="${evidenceIconDataUri(ev.category)}" alt="">
      <div class="tagrow"><span class="tag gold">${ev.category}</span></div>
      <h4>${ev.title}</h4>
      <p>${ev.desc}</p>
      <div class="src">FILE ${ev.id.toUpperCase()}</div>
    `;
    grid.appendChild(card);
  });
  el.appendChild(grid);
  return el;
}

function renderTimeline(c){
  const el = document.createElement('div');
  el.innerHTML = `<div class="panel-head"><h2>Timeline</h2><div class="sub">NIGHT OF THE MURDER</div></div>`;
  const tl = document.createElement('div');
  tl.className='tl';
  c.timeline.forEach(t=>{
    const item = document.createElement('div');
    item.className='tl-item confirmed';
    item.innerHTML = `<div class="tl-time">${t.time}</div><div class="tl-txt">${t.text}</div>`;
    tl.appendChild(item);
  });
  el.appendChild(tl);
  return el;
}