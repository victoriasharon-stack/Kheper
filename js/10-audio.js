let audioCtx = null;
let masterGain = null;
let musicNodes = [];
let musicPlaying = false;
let arpTimer = null;

function startMusic(){
  if(musicPlaying) return;
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  if(audioCtx.state === 'suspended'){ audioCtx.resume(); }

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);
  masterGain.gain.linearRampToValueAtTime(0.16, audioCtx.currentTime + 2.5);

  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.35;
  const padFilter = audioCtx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 900;
  padFilter.Q.value = 0.5;

  const padFreqs = [130.81, 164.81, 196.00];
  padFreqs.forEach((f,i)=>{
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    osc.detune.value = (i-1)*4;
    osc.connect(padGain);
    osc.start();
    musicNodes.push(osc);
  });
  padGain.connect(padFilter);
  padFilter.connect(masterGain);

  const padLfo = audioCtx.createOscillator();
  padLfo.frequency.value = 0.06;
  const padLfoGain = audioCtx.createGain();
  padLfoGain.gain.value = 260;
  padLfo.connect(padLfoGain);
  padLfoGain.connect(padFilter.frequency);
  padLfo.start();
  musicNodes.push(padLfo);

  const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 987.77];
  let lastIdx = 0;
  function bellNote(){
    if(!musicPlaying) return;
    const step = pick([-2,-1,-1,1,1,2]);
    lastIdx = Math.max(0, Math.min(scale.length-1, lastIdx+step));
    const freq = scale[lastIdx];

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq*2;

    const g = audioCtx.createGain();
    g.gain.value = 0;
    const g2 = audioCtx.createGain();
    g2.gain.value = 0;

    osc.connect(g); g.connect(masterGain);
    osc2.connect(g2); g2.connect(masterGain);

    const t = audioCtx.currentTime;
    g.gain.linearRampToValueAtTime(0.1, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t+1.6);
    g2.gain.linearRampToValueAtTime(0.03, t+0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t+1.1);

    osc.start(t); osc.stop(t+1.7);
    osc2.start(t); osc2.stop(t+1.2);

    arpTimer = setTimeout(bellNote, 850 + Math.random()*650);
  }
  arpTimer = setTimeout(bellNote, 900);

  musicPlaying = true;
  try{ localStorage.setItem('kheper_music', 'on'); }catch(e){}
  updateMusicButton();
}

function stopMusic(){
  if(!musicPlaying) return;
  if(masterGain){
    const t = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(0, t+1.2);
  }
  clearTimeout(arpTimer);
  const nodesToStop = musicNodes;
  setTimeout(()=>{
    nodesToStop.forEach(n=>{ try{ n.stop(); }catch(e){} });
  }, 1300);
  musicNodes = [];
  musicPlaying = false;
  try{ localStorage.setItem('kheper_music', 'off'); }catch(e){}
  updateMusicButton();
}

function toggleMusic(){
  if(musicPlaying) stopMusic(); else startMusic();
}

function updateMusicButton(){
  const btn = document.getElementById('musicToggle');
  if(!btn) return;
  btn.textContent = musicPlaying ? '♫' : '♪';
  btn.classList.toggle('playing', musicPlaying);
  btn.title = musicPlaying ? 'Music on — click to mute' : 'Music off — click to play';
}

(function initMusicAutostart(){
  const attach = ()=>{
    const btn = document.getElementById('musicToggle');
    if(btn){ btn.addEventListener('click', toggleMusic); updateMusicButton(); }

    let userPreviouslyMuted = false;
    try{ userPreviouslyMuted = localStorage.getItem('kheper_music') === 'off'; }catch(e){}

    if(!userPreviouslyMuted){
      const autostart = ()=>{
        startMusic();
        window.removeEventListener('pointerdown', autostart, true);
        window.removeEventListener('keydown', autostart, true);
        window.removeEventListener('touchstart', autostart, true);
      };
      window.addEventListener('pointerdown', autostart, true);
      window.addEventListener('keydown', autostart, true);
      window.addEventListener('touchstart', autostart, true);
    }
  };
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();