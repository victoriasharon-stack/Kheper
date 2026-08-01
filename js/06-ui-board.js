function boardCards(c){
  const cards = [];
  c.suspects.forEach(s=>cards.push({ id:'card_'+s.id, kind:'suspect', title:s.name, sub:s.occupation }));
  c.evidence.filter(e=>e.discovered).forEach(ev=>cards.push({ id:'card_'+ev.id, kind:'evidence', title:ev.title, sub:ev.category }));
  return cards;
}
function ensurePositions(c, cards){
  const cols = 4;
  cards.forEach((card,i)=>{
    if(!c.boardPositions[card.id]){
      c.boardPositions[card.id] = { x: 40 + (i%cols)*210, y: 30 + Math.floor(i/cols)*140 };
    }
  });
}

function renderBoard(c){
  const el = document.createElement('div');
  el.innerHTML = `<div class="panel-head"><h2>Investigation Board</h2><div class="sub">DRAG · LINK · MARK CONTRADICTIONS</div></div>`;

  const cards = boardCards(c);
  if(!cards.length){
    const empty = document.createElement('div');
    empty.className='empty';
    empty.textContent='Nothing pinned yet. Evidence you log and suspects you meet will appear here to connect.';
    el.appendChild(empty);
    return el;
  }
  ensurePositions(c, cards);

  const toolbar = document.createElement('div');
  toolbar.className='board-toolbar';
  const modes = [
    {k:'move', label:'Move'},
    {k:'link', label:'Link (gold)'},
    {k:'contradict', label:'Mark Contradiction (red)'},
    {k:'erase', label:'Erase Link'},
  ];
  toolbar.innerHTML = modes.map(m=>`<button class="btn ${state.boardMode===m.k?'primary':'ghost'}" data-mode="${m.k}">${m.label}</button>`).join('') + `<span class="hint">Click two cards to connect · click a link to remove it in erase mode</span>`;
  toolbar.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{ state.boardMode=b.dataset.mode; state.boardSelection=null; render(); });
  });
  el.appendChild(toolbar);

  const board = document.createElement('div');
  board.className='corkboard';
  const svgNS='http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('class','link-layer');
  board.appendChild(svg);

  function cardCenter(id){
    const p = c.boardPositions[id];
    return { x: p.x + 85, y: p.y + 40 };
  }

  function drawLinks(){
    svg.innerHTML='';
    c.boardLinks.forEach((link, idx)=>{
      const a = cardCenter(link.a), b = cardCenter(link.b);
      const lineEl = document.createElementNS(svgNS,'line');
      lineEl.setAttribute('x1',a.x); lineEl.setAttribute('y1',a.y);
      lineEl.setAttribute('x2',b.x); lineEl.setAttribute('y2',b.y);
      lineEl.setAttribute('stroke', link.type==='contradict' ? '#a3182a' : '#b8863f');
      lineEl.setAttribute('stroke-width', link.type==='contradict' ? '2.5' : '1.5');
      lineEl.style.pointerEvents='stroke';
      lineEl.style.cursor='pointer';
      lineEl.addEventListener('click', ()=>{
        if(state.boardMode==='erase'){
          c.boardLinks.splice(idx,1);
          renderBoardOnly();
        }
      });
      svg.appendChild(lineEl);
    });
  }

  cards.forEach(card=>{
    const pos = c.boardPositions[card.id];
    const div = document.createElement('div');
    div.className = 'pin-card ' + card.kind + (state.boardSelection===card.id?' selected':'');
    div.style.left = pos.x+'px';
    div.style.top = pos.y+'px';
    div.innerHTML = `<span class="k">${card.kind}</span><h5>${card.title}</h5><p>${card.sub}</p>`;

    div.addEventListener('pointerdown', (e)=>{
      if(state.boardMode!=='move') return;
      state.dragging = { id:card.id, offX:e.clientX-pos.x, offY:e.clientY-pos.y };
      div.setPointerCapture(e.pointerId);
    });
    div.addEventListener('pointermove', (e)=>{
      if(state.dragging && state.dragging.id===card.id){
        c.boardPositions[card.id] = { x:e.clientX-state.dragging.offX, y:e.clientY-state.dragging.offY };
        div.style.left = c.boardPositions[card.id].x+'px';
        div.style.top = c.boardPositions[card.id].y+'px';
        drawLinks();
      }
    });
    div.addEventListener('pointerup', ()=>{ state.dragging=null; });

    div.addEventListener('click', ()=>{
      if(state.boardMode==='move' || state.boardMode==='erase') return;
      if(!state.boardSelection){
        state.boardSelection = card.id;
        renderBoardOnly();
      } else if(state.boardSelection!==card.id){
        c.boardLinks.push({ a: state.boardSelection, b: card.id, type: state.boardMode==='contradict'?'contradict':'link' });
        state.boardSelection = null;
        renderBoardOnly();
      } else {
        state.boardSelection = null;
        renderBoardOnly();
      }
    });

    board.appendChild(div);
  });

  el.appendChild(board);
  drawLinks();

  function renderBoardOnly(){
    const content = document.querySelector('.content');
    if(content){ content.innerHTML=''; content.appendChild(renderBoard(c)); }
  }

  return el;
}