function openAccuseModal(){
  const c = state.case;
  const back = document.createElement('div');
  back.className='modal-back';
  back.innerHTML = `
    <div class="modal" style="border-color:var(--gold-dim);">
      <div class="verdict-eyebrow" style="color:var(--gold);">Final Accusation</div>
      <h2>Name the culprit</h2>
      <p style="color:var(--ink-dim); line-height:1.7; margin-bottom:20px;">This ends the investigation. Choose carefully — an accusation cannot be walked back once made.</p>
      <div class="accuse-grid">
        <div class="field">
          <label>Suspect</label>
          <select id="accSuspect">
            <option value="">— Select a suspect —</option>
            ${c.suspects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="btn-row" style="margin-top:26px;">
        <button class="btn primary" id="submitAcc">Submit Accusation</button>
        <button class="btn ghost" id="cancelAcc">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(back);
  back.querySelector('#cancelAcc').addEventListener('click', ()=> back.remove());
  back.querySelector('#submitAcc').addEventListener('click', ()=>{
    const val = back.querySelector('#accSuspect').value;
    if(!val){ toast('Select a suspect first.', 'crimson'); return; }
    back.remove();
    resolveCase(val);
  });
}

function resolveCase(accusedId){
  const c = state.case;
  const correct = accusedId === c.murdererId;
  const murderer = c.suspects.find(s=>s.id===c.murdererId);
  const accused = c.suspects.find(s=>s.id===accusedId);

  if(!correct) c.wrongAccusations += 1;

  const foundCount = c.evidence.filter(e=>e.discovered).length;
  const evidenceRatio = foundCount / c.evidence.length;
  let score;
  if(correct){
    score = Math.round(60 + evidenceRatio*40 - c.wrongAccusations*10);
    score = Math.max(20, Math.min(100, score));
  } else {
    score = Math.round(Math.max(0, evidenceRatio*25 - 10));
  }

  if(correct){
    state.profile.casesSolved += 1;
  }
  const prevTotal = state.profile.totalScore * Math.max(0, state.profile.casesPlayed-1);
  state.profile.totalScore = Math.round((prevTotal + score) / state.profile.casesPlayed) || score;
  state.profile.rank = rankForScore(state.profile.totalScore);
  saveProfile();
  renderRankChip();

  const back = document.createElement('div');
  back.className='modal-back';
  const modal = document.createElement('div');
  modal.className = 'modal ' + (correct?'win':'lose');

  const steps = [];
  steps.push(`${c.victim.name} was killed with ${c.weapon} in ${c.room} around ${c.murderTime}.`);
  steps.push(`${murderer.name} claimed to be in ${murderer.alibiLocation} — ${
    murderer.alibiCorroborator.type==='suspect' ? `naming ${murderer.alibiCorroborator.name} as a witness, who in fact denies it.` :
    murderer.alibiCorroborator.type==='staff' ? `naming ${murderer.alibiCorroborator.name}, whose real account placed them elsewhere.` :
    `with no one able to confirm it at all.`
  }`);
  steps.push(`Physical evidence — placement records, a keycard log, or a witness sighting — put ${murderer.name} at ${c.room} during the murder window, not where they claimed.`);
  steps.push(`${murderer.name} ${murderer.motive}, giving them a clear motive alongside the broken alibi.`);

  modal.innerHTML = `
    <img class="verdict-portrait" src="${portraitDataUri(correct ? murderer.name : accused.name)}" alt="">
    <div class="verdict-eyebrow">${correct ? 'Case Closed' : 'Wrong Accusation'}</div>
    <h2>${correct ? `You named ${murderer.name}. Correct.` : `${accused.name} was innocent.`}</h2>
    <p style="color:var(--ink-dim); line-height:1.7;">
      ${correct
        ? `Your reasoning holds. ${murderer.name} is taken into custody.`
        : `${accused.name} was cleared — ${murderer.name} was the true culprit, and remains free. Investigate further and try again.`}
    </p>
    <div class="stats">
      <div class="stat"><b>${score}</b><span>Case Score</span></div>
      <div class="stat"><b>${foundCount}/${c.evidence.length}</b><span>Evidence Found</span></div>
      <div class="stat"><b>${c.wrongAccusations}</b><span>Wrong Accusations</span></div>
      <div class="stat"><b>${state.profile.rank}</b><span>Current Rank</span></div>
    </div>
    ${correct ? `
    <div style="font-family:var(--font-mono); font-size:10.5px; letter-spacing:1.5px; color:var(--ink-faint); text-transform:uppercase; margin-top:10px;">How the case broke</div>
    <div class="solution-steps">${steps.map(s=>`<div class="step">${s}</div>`).join('')}</div>
    ` : ''}
    <div class="btn-row" style="margin-top:24px;">
      ${correct ? `<button class="btn primary" id="nextCase">Open Next Case File →</button>`
                 : `<button class="btn danger" id="keepGoing">Keep Investigating</button>`}
      <button class="btn ghost" id="toMenu">Back to Menu</button>
    </div>
  `;
  back.appendChild(modal);
  document.body.appendChild(back);

  if(correct){
    modal.querySelector('#nextCase').addEventListener('click', ()=>{
      back.remove(); state.screen='start'; render();
    });
  } else {
    modal.querySelector('#keepGoing').addEventListener('click', ()=> back.remove());
  }
  modal.querySelector('#toMenu').addEventListener('click', ()=>{
    back.remove(); state.screen='start'; render();
  });
}