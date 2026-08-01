function hashSeed(str){
  let h = 0;
  for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i)) >>> 0; }
  return h;
}
function seededRand(seed){
  let s = seed || 1;
  return function(){
    s = (s*1103515245 + 12345) & 0x7fffffff;
    return (s % 10000) / 10000;
  };
}

function portraitDataUri(name, opts){
  opts = opts || {};
  const seed = hashSeed(name);
  const rnd = seededRand(seed);
  const hue = 14 + Math.floor(rnd()*26);
  const bustHue = hue + Math.floor(rnd()*10) - 5;
  const bgDark = `hsl(${hue}, 24%, 7%)`;
  const bgMid  = `hsl(${hue}, 20%, 13%)`;
  const bust   = `hsl(${bustHue}, 16%, 11%)`;
  const bustHi = `hsl(${bustHue}, 20%, 18%)`;
  const scan   = opts.redacted ? 0.14 : 0.07;
  const stampText = opts.redacted ? 'UNIDENTIFIED' : 'CASE FILE';
  const fileNo = (seed % 8999 + 1000);
  const shoulderW = 60 + Math.floor(rnd()*14);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  <defs>
    <radialGradient id="bg${seed}" cx="50%" cy="28%" r="85%">
      <stop offset="0%" stop-color="${bgMid}"/>
      <stop offset="100%" stop-color="${bgDark}"/>
    </radialGradient>
    <linearGradient id="bust${seed}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bustHi}"/>
      <stop offset="100%" stop-color="${bust}"/>
    </linearGradient>
    <pattern id="scan${seed}" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="2" fill="#000" opacity="${scan}"/>
    </pattern>
  </defs>
  <rect width="200" height="240" fill="url(#bg${seed})"/>
  <ellipse cx="100" cy="112" rx="40" ry="48" fill="url(#bust${seed})"/>
  <path d="M ${100-shoulderW} 240 Q 100 158 ${100+shoulderW} 240 Z" fill="url(#bust${seed})"/>
  <rect x="0" y="0" width="200" height="240" fill="url(#scan${seed})"/>
  <rect x="0" y="0" width="200" height="240" fill="none" stroke="hsl(${hue},30%,30%)" stroke-width="1" opacity="0.4"/>
  <text x="10" y="228" font-family="Courier New, monospace" font-size="9" fill="hsl(${hue},40%,55%)" opacity="0.85" letter-spacing="1">FILE ${fileNo}</text>
  <text x="190" y="16" font-family="Courier New, monospace" font-size="8" fill="hsl(${hue},40%,55%)" opacity="0.7" letter-spacing="1" text-anchor="end">${stampText}</text>
  <line x1="0" y1="0" x2="200" y2="240" stroke="#a3182a" stroke-width="0.6" opacity="0.06"/>
  <line x1="200" y1="0" x2="0" y2="240" stroke="#a3182a" stroke-width="0.6" opacity="0.06"/>
</svg>`.trim();

  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function evidenceIconDataUri(category){
  const stroke = '#b8863f';
  const bg = '#160e0a';
  const icons = {
    physical: `<circle cx="24" cy="24" r="10" fill="none" stroke="${stroke}" stroke-width="2"/><line x1="31" y1="31" x2="42" y2="42" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>`,
    forensic: `<path d="M24 10 C14 10 12 20 12 26 C12 34 16 40 24 40 C32 40 36 34 36 26 C36 20 34 10 24 10 Z" fill="none" stroke="${stroke}" stroke-width="1.6"/><path d="M18 20 C18 16 20 14 24 14 C28 14 30 16 30 20" fill="none" stroke="${stroke}" stroke-width="1.2"/><path d="M16 24 C16 30 19 35 24 35" fill="none" stroke="${stroke}" stroke-width="1.2"/><path d="M32 24 C32 30 29 35 24 35" fill="none" stroke="${stroke}" stroke-width="1.2"/>`,
    testimony: `<rect x="9" y="12" width="30" height="20" rx="2" fill="none" stroke="${stroke}" stroke-width="2"/><path d="M16 32 L14 39 L23 32" fill="none" stroke="${stroke}" stroke-width="2"/>`,
    document: `<path d="M14 8 H30 L36 14 V40 H14 Z" fill="none" stroke="${stroke}" stroke-width="2"/><path d="M30 8 V14 H36" fill="none" stroke="${stroke}" stroke-width="2"/><line x1="18" y1="22" x2="32" y2="22" stroke="${stroke}" stroke-width="1.4"/><line x1="18" y1="28" x2="32" y2="28" stroke="${stroke}" stroke-width="1.4"/><line x1="18" y1="34" x2="27" y2="34" stroke="${stroke}" stroke-width="1.4"/>`,
  };
  const inner = icons[category] || icons.document;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="${bg}"/>${inner}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}