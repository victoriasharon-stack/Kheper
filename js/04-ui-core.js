function renderRankChip(){
  document.getElementById('rankLabel').textContent = state.profile.rank.toUpperCase();
}

function render(){
  const main = document.getElementById('main');
  main.innerHTML = '';
  if(state.screen === 'start'){
    main.appendChild(renderStart());
  } else {
    main.appendChild(renderGameShell());
  }
}

function renderStart(){
  const wrap = document.createElement('div');
  wrap.className = 'start-wrap';
  const diffs = [
    {k:'easy', n:'4', d:'Easy · 4 suspects'},
    {k:'medium', n:'6', d:'Medium · 6 suspects'},
    {k:'hard', n:'8', d:'Hard · 8 suspects'},
    {k:'expert', n:'8+', d:'Expert · complex web'},
  ];
  wrap.innerHTML = `
    <div class="start-card">
      <div class="start-eyebrow">Procedural Mystery Engine</div>
      <h2>Every case is generated once.<br>You will never see it again.</h2>
      <p>A body has been found. Somewhere among the suspects in this file is exactly one true culprit — everyone else has something to hide, but only one of them is lying about where they were. Choose your difficulty and open the case.</p>
      <div class="diff-grid" id="diffGrid">
        ${diffs.map(d=>`<div class="diff-opt ${state.difficulty===d.k?'active':''}" data-diff="${d.k}"><span class="n">${d.n}</span><span class="d">${d.d}</span></div>`).join('')}
      </div>
      <div class="btn-row">
        <button class="btn primary" id="beginBtn">Open New Case File →</button>
      </div>
      <div class="profile-line">
        <span><b>${state.profile.rank}</b> current rank</span>
        <span><b>${state.profile.casesSolved}</b> cases closed</span>
        <span><b>${state.profile.casesPlayed}</b> cases opened</span>
      </div>
    </div>
  `;
  wrap.querySelectorAll('.diff-opt').forEach(el=>{
    el.addEventListener('click', ()=>{ state.difficulty = el.dataset.diff; render(); });
  });
  wrap.querySelector('#beginBtn').addEventListener('click', ()=>{
    startNewCase(state.difficulty);
  });
  return wrap;
}

function startNewCase(difficulty){
  state.case = generateCase(difficulty);
  state.dialogueLog = {};
  state.activeTab = 'overview';
  state.activeSuspectId = null;
  state.boardSelection = null;
  state.boardMode = 'move';
  state.profile.casesPlayed += 1;
  saveProfile();
  state.screen = 'game';
  render();
  toast(`Case opened: ${state.case.victim.name} — ${state.case.estate}`);
}

function renderGameShell(){
  const wrap = document.createElement('div');
  wrap.className = 'game-shell';

  const c = state.case;
  const foundCount = c.evidence.filter(e=>e.discovered).length;
  const talkedCount = c.suspects.filter(s=>s.talked).length;

  const navItems = [
    {k:'overview', label:'Case Overview'},
    {k:'scene', label:'Crime Scene'},
    {k:'suspects', label:'Suspects', count:c.suspects.length},
    {k:'interview', label:'Interview Room'},
    {k:'evidence', label:'Evidence Locker', count:foundCount},
    {k:'timeline', label:'Timeline'},
    {k:'board', label:'Investigation Board'},
  ];

  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  sidebar.innerHTML = `
    <div class="case-id">Case File<b>${c.victim.name}</b></div>
    ${navItems.map(n=>`
      <div class="nav-item ${state.activeTab===n.k?'active':''}" data-tab="${n.k}">
        <span>${n.label}</span>
        ${n.count!==undefined?`<span class="count">${n.count}</span>`:''}
      </div>
    `).join('')}
    <div class="sidebar-foot">
      <button class="btn danger" id="accuseBtn" style="width:100%; margin-bottom:8px;">Make an Accusation</button>
      <button class="btn ghost" id="newCaseBtn" style="width:100%;">Abandon Case</button>
    </div>
  `;
  sidebar.querySelectorAll('.nav-item').forEach(el=>{
    el.addEventListener('click', ()=>{ state.activeTab = el.dataset.tab; render(); });
  });
  sidebar.querySelector('#accuseBtn').addEventListener('click', openAccuseModal);
  sidebar.querySelector('#newCaseBtn').addEventListener('click', ()=>{
    if(confirm('Abandon this investigation and return to the case menu? Progress on this case will be lost.')){
      state.screen = 'start'; render();
    }
  });

  const content = document.createElement('div');
  content.className = 'content';
  const renderers = {
    overview: renderOverview, scene: renderScene, suspects: renderSuspects,
    interview: renderInterview, evidence: renderEvidenceLocker,
    timeline: renderTimeline, board: renderBoard,
  };
  content.appendChild(renderers[state.activeTab](c));

  wrap.appendChild(sidebar);
  wrap.appendChild(content);
  return wrap;
}