/* Helu · Rediseño B — helpers para armar pantallas como HTML · v2 (auditoría UX 2026-11-18) */
const FILE='<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>';
const IC={
 home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
 route:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
 calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 file:FILE,fileUp:FILE+'<path d="M12 18v-6M9 15l3-3 3 3"/>',filePlus:FILE+'<path d="M12 18v-6M9 15h6"/>',
 fileText:FILE+'<path d="M8 13h8M8 17h5"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
 phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 alarm:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/>',
 trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0z"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 pill:'<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7zM8.5 8.5l7 7"/>',
 heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
 backpack:'<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8M8 18h8M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 userPlus:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
 user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
 chevR:'<path d="m9 18 6-6-6-6"/>',chevL:'<path d="m15 18-6-6 6-6"/>',chevD:'<path d="m6 9 6 6 6-6"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
 eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 sparkles:'<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
 qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 filter:'<path d="M3 6h18M7 12h10M10 18h4"/>',
 camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
 upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
 edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 trash:'<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
 copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
 download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
 mapPin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
 video:'<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
 stetho:'<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
 activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
 help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
 calendarDays:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
 layoutDashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
 folder:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
 more:'<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
 tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
 globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
 refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
 droplet:'<path d="M12 2.7 17.7 9a8 8 0 1 1-11.4 0z"/>',
 send:'<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
 flash:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
 rotate:'<path d="M3 2v6h6"/><path d="M3.5 13a9 9 0 1 0 2.2-9.4L3 8"/>',
 grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 checkSquare:'<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
 pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
};
const ic=(n,z=20,c='currentColor',w=2)=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${IC[n]}</svg>`;
const flame=(z=20,c1='#F97316',c2='#FCD34D')=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24"><path fill="${c1}" d="M12 1.5c.6 3.2 2.6 4.9 4.3 6.9 1.6 1.9 2.7 3.8 2.7 6.4A7 7 0 0 1 12 21.8a7 7 0 0 1-7-7c0-2.6 1.2-4.6 2.6-6 .1 1.8.9 3.1 2.2 3.6C9.6 8.6 10.4 4.6 12 1.5z"/><path fill="${c2}" d="M12 11c.4 1.8 1.6 2.6 2.4 3.6.6.8.9 1.5.9 2.4a3.3 3.3 0 0 1-6.6 0c0-1.4.7-2.4 1.5-3.1.2.8.6 1.3 1.1 1.5-.1-1.6.2-3.1.7-4.4z"/></svg>`;
const star=(z=20,c='#F59E0B')=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24"><path fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>`;
let _mid=0;
function mas(z=80,pose='happy',cele=false){
 const A={happy:['M30 78 Q14 86 18 102','M90 78 Q106 86 102 102'],wave:['M30 78 Q14 86 18 102','M90 76 Q110 64 106 40'],point:['M30 78 Q14 86 18 102','M90 78 Q108 76 116 66'],joy:['M30 76 Q10 62 14 38','M90 76 Q110 62 106 38'],think:['M30 78 Q14 86 18 102','M90 78 Q104 70 86 58']}[pose];
 const eyes=pose==='joy'?'<path d="M42 48 Q48 40 54 48 M66 48 Q72 40 78 48" stroke="#0F172A" stroke-width="4" fill="none" stroke-linecap="round"/>':'<ellipse cx="48" cy="46" rx="6" ry="7.5" fill="#0F172A"/><ellipse cx="72" cy="46" rx="6" ry="7.5" fill="#0F172A"/><circle cx="50" cy="43.5" r="2.2" fill="#fff"/><circle cx="74" cy="43.5" r="2.2" fill="#fff"/>';
 const mouth=pose==='joy'?'<path d="M51 57 Q60 70 69 57 Z" fill="#0F172A"/>':pose==='think'?'<path d="M54 60 H66" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round"/>':'<path d="M53 58 Q60 65 67 58" stroke="#0F172A" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
 const id='mg'+(++_mid);
 const spk=cele?`<g class="spk">${[[10,30],[110,24],[4,86],[116,80],[60,-18]].map(([x,y],i)=>`<path d="M${x} ${y-7} L${x+2} ${y-2} L${x+7} ${y} L${x+2} ${y+2} L${x} ${y+7} L${x-2} ${y+2} L${x-7} ${y} L${x-2} ${y-2} Z" fill="${["#F59E0B","#22C55E","#F97316","#3B82F6","#DB2777"][i]}" style="animation-delay:${i*70}ms"/>`).join("")}</g>`:"";
 return `<svg class="mascot${cele?" cele":""}" width="${z}" height="${Math.round(z*140/120)}" viewBox="0 0 120 140" style="overflow:visible"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60A5FA"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs><ellipse class="msh" cx="60" cy="134" rx="30" ry="5" fill="#0F172A" fill-opacity=".12"/><g class="mb"><path class="al" d="${A[0]}" stroke="#1D4ED8" stroke-width="12" stroke-linecap="round" fill="none"/><path class="ar" d="${A[1]}" stroke="#1D4ED8" stroke-width="12" stroke-linecap="round" fill="none"/><rect x="24" y="16" width="72" height="112" rx="36" fill="url(#${id})"/><ellipse cx="44" cy="30" rx="11" ry="6" fill="#fff" fill-opacity=".3" transform="rotate(-20 44 30)"/><rect x="38" y="68" width="44" height="46" rx="20" fill="#fff"/>${eyes}<ellipse cx="37" cy="58" rx="6" ry="3.5" fill="#F9A8D4"/><ellipse cx="83" cy="58" rx="6" ry="3.5" fill="#F9A8D4"/>${mouth}</g>${spk}</svg>`;
}
const logo=(z=22,c='#1D4ED8')=>`<div class="row g8" style="gap:7px"><div style="width:${z+6}px;height:${z+6}px;border-radius:${Math.round((z+6)*.32)}px;background:linear-gradient(#60A5FA,#1D4ED8);display:grid;place-items:center">${ic('plus',Math.round(z*.7),'#fff',4)}</div><span style="font:900 ${z}px Nunito;color:${c}">helu</span></div>`;
const chip=(t,tone='b',icon='')=>`<span class="chip c-${tone}">${icon}${t}</span>`;
const btn=(t,k='',icon='',st='')=>`<div class="btn ${k}" style="${st}">${icon}${t}</div>`;
const tile=(tone,n,z=19,cls='')=>`<div class="tile t-${tone} ${cls}">${ic(n,z,'currentColor',2.2)}</div>`;
const card=(inner,cls='',st='')=>`<div class="card ${cls}" style="${st}">${inner}</div>`;
const row=(tone,n,t,s,right='',extra='')=>`<div class="row" ${extra}>${tile(tone,n)}<div class="grow"><div class="t clamp2">${t}</div>${s?`<div class="s clamp2">${s}</div>`:''}</div>${right}</div>`;
/* field: v2.2 agrega help (ayuda persistente), err (error en línea) y ai (precargado por IA) según pages/formularios.md §2–3 */
const field=(l,{icon='',ph='',val='',trail='',area=false,focus=false,help='',err='',ai=false}={})=>`<div class="field"><div class="lbl">${l}</div><div class="inp ${val?'val':''} ${area?'area':''} ${focus?'focus':''} ${err?'err':''} ${ai?'ai':''}">${icon?ic(icon,18,'var(--color-text-muted)'):''}<span class="grow">${val||ph}</span>${ai?chip('IA','vi',ic('sparkles',11)):''}${trail}</div>${err?`<div class="row g6 s" role="alert" style="color:var(--color-danger-fg)">${ic('info',14,'currentColor')}${err}</div>`:help?`<div class="s">${help}</div>`:''}</div>`;
const select=(l,val,ph='',ai=false)=>field(l,{val,ph,ai,trail:ic('chevD',18,'var(--color-text-muted)')});
const seg=(items,on=0)=>`<div class="seg">${items.map((x,i)=>`<div class="${i===on?'on':''}">${x}</div>`).join('')}</div>`;
const search=ph=>`<div class="search">${ic('search',18,'var(--color-text-muted)')}<span class="grow">${ph}</span></div>`;
const tog=(on=true)=>`<span class="tog ${on?'on':''}"><i></i></span>`;
const bar=(p,c='#22C55E',bg='#E2E8F0',h=10)=>`<div class="bar" style="height:${h}px;background:${bg}"><i style="width:${Math.round(p*100)}%;background:${c}"></i></div>`;
const ring=(z,p,c,inner)=>{const r=z/2-6,C=2*Math.PI*r;return `<div style="position:relative;width:${z}px;height:${z}px;flex:none"><svg width="${z}" height="${z}"><circle cx="${z/2}" cy="${z/2}" r="${r}" fill="none" stroke="#E2E8F0" stroke-width="8"/><circle cx="${z/2}" cy="${z/2}" r="${r}" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${z/2} ${z/2})"/></svg><div style="position:absolute;left:0;top:0;width:100%;height:100%;display:grid;place-items:center">${inner}</div></div>`};
const medal=(z,bg,edge,inner,lock)=>`<div style="width:${z}px;height:${z}px;border-radius:50%;display:grid;place-items:center;flex:none;background:${lock?'#F1F5F9':bg};border-bottom:3px solid ${lock?'#E2E8F0':edge}">${lock?ic('lock',Math.round(z*.42),'#94A3B8'):inner}</div>`;
const mood=(k,z=44)=>{const M={muymal:['#EF4444',-5],mal:['#F97316',-2.5],regular:['#F59E0B',0],bien:['#22C55E',3],excelente:['#10B981',6]}[k];return `<svg width="${z}" height="${z}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="${M[0]}"/><circle cx="14" cy="17" r="2.4" fill="#0F172A"/><circle cx="26" cy="17" r="2.4" fill="#0F172A"/><path d="M13 ${27-M[1]/2} Q20 ${27+M[1]} 27 ${27-M[1]/2}" stroke="#0F172A" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`};
const fchip=(n=12)=>chip(String(n),'or',flame(15));
const lchip=(t='Nv. 4')=>chip(t,'am',star(14));
const bellBtn=(dot=true)=>`<div class="iconbtn" aria-label="Notificaciones" style="position:relative">${ic('bell',17,'var(--primitive-color-slate-600)')}${dot?'<span class="dot" style="position:absolute;top:7px;right:8px;background:var(--primitive-color-red-500);border:2px solid #fff;width:10px;height:10px"></span>':''}</div>`;
const avatar=(z=36,t='AG',bg='#2563EB')=>`<div class="avatar" style="width:${z}px;height:${z}px;background:${bg};font-size:${Math.round(z*.36)}px">${t}</div>`;
const hint=(t,pose='point')=>`<div class="hint">${mas(32,pose)}<span class="grow">${t}</span></div>`;
const toast=(t,tone='gr',n='check',act='')=>`<div class="toast"><div class="tile t-${tone}" style="width:34px;height:34px;border-radius:11px">${ic(n,17,'currentColor',2.4)}</div><span class="grow">${t}</span>${act?`<span class="act">${act}</span>`:''}</div>`;
/* v2 */
const radio=(on=false)=>`<span class="radio ${on?'on':''}"></span>`;
const moreRow=(t,s)=>`<div class="more"><div class="grow"><div>${t}</div>${s?`<div class="s" style="font-weight:400">${s}</div>`:''}</div>${ic('chevD',18,'var(--color-brand-solid)',2.4)}</div>`;
const xbtn=(lbl='Cerrar')=>`<div class="iconbtn" aria-label="${lbl}" style="background:var(--color-surface-muted);border:0">${ic('x',18,'var(--primitive-color-slate-600)')}</div>`;
const kebab=(lbl='Más opciones')=>`<div class="iconbtn ghostbtn" aria-label="${lbl}">${ic('more',18,'var(--color-text-muted)')}</div>`;
const redLink=(t,icon='trash')=>`<div class="row" style="justify-content:center;margin-top:8px"><span class="link red">${ic(icon,16,'currentColor',2.2)}${t}</span></div>`;
const conf=(n,w,h,seed=7,top=40)=>{const C=['#3B82F6','#22C55E','#F97316','#F59E0B','#DB2777','#8B5CF6'];let s=seed;const r=()=>(s=(s*9301+49297)%233280)/233280;let o='';for(let i=0;i<n;i++){o+=`<span class="conf" style="left:${Math.round(r()*w)}px;top:${Math.round(top+r()*h)}px;width:${6+Math.round(r()*6)}px;height:${10+Math.round(r()*8)}px;background:${C[i%6]};transform:rotate(${Math.round(r()*180-90)}deg)"></span>`}return o};

const SBAR=`<div class="sbar"><span>9:41</span><svg width="66" height="12" viewBox="0 0 66 12" fill="#0F172A"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="6" width="3" height="6" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/><path d="M30 3.5a9 9 0 0 1 12 0l-1.4 1.5a7 7 0 0 0-9.2 0zM32.8 6.5a5 5 0 0 1 6.4 0L36 10z"/><rect x="45.7" y="1.7" width="16.6" height="8.6" rx="2.5" fill="none" stroke="#0F172A" stroke-width="1.4"/><rect x="47.5" y="3.5" width="12" height="5" rx="1.2"/></svg></div>`;
const TABS=[['docs','Documentos','fileText'],['agenda','Agenda','calendarDays'],['inicio','Inicio','layoutDashboard'],['mochilas','Mochilas','folder'],['mas','Más','menu']];
/* tabbar(activa, gestión?) · gestión = {ini, ring}: en modo gestión el botón central muestra las iniciales del dependiente con su color de contexto (igual que CenterTabIcon) */
const tabItem=(a,mg)=>([k,l,n])=>{const on=k===a;if(k==='inicio'){const inner=mg?`<span style="font:700 13px Inter;color:#fff">${mg.ini}</span>`:ic(n,24,'#fff',2);return `<div class="tab center ${on?'on':''}"><span class="tw" style="${mg?`border:3px solid ${mg.ring};box-shadow:0 4px 8px color-mix(in srgb,${mg.ring} 40%,transparent)`:''}">${inner}</span><span class="tl">${l}</span></div>`}return `<div class="tab ${on?'on':''}"><span class="tw">${ic(n,24,on?'var(--color-brand-solid)':'var(--color-text-muted)',2)}</span><span class="tl">${l}</span></div>`};
/* tabbar(activa, gestión?) · grupo izquierdo | Inicio al centro | grupo derecho: cada etiqueta toma su ancho y nunca se corta */
const tabbar=(a,mg)=>{const it=tabItem(a,mg);return `<nav class="tabbar"><div class="tgrp">${TABS.slice(0,2).map(it).join('')}</div>${it(TABS[2])}<div class="tgrp">${TABS.slice(3).map(it).join('')}</div><span class="homeind"></span></nav>`};
const fab=(n='plus')=>`<div class="fab">${ic(n,26,'#fff',3)}</div>`;
/* phone(inner,{tab,bg,fix,fab,over,pad,bar}) · bar = barra de acción fija abajo (v2) */
function phone(inner,o={}){return `<div class="phone ${o.tab?'':'notab'} ${o.fix||o.over?'fix':''} ${o.bar?'hasbar':''}" style="${o.bg?'background:'+o.bg+';':''}${o.st||''}">${SBAR}${inner}${o.fab?fab(o.fab):''}${o.bar?`<div class="bbar">${o.bar}</div>`:''}${o.tab?tabbar(o.tab,o.manage):''}${o.over||''}</div>`}
const mtop=(right='')=>`<div class="mhead">${logo(20)}<span class="grow"></span>${right||bellBtn()}</div>`;
const mback=(title,right='',sub='')=>`<div class="mhead"><div class="iconbtn" aria-label="Volver">${ic('chevL',20,'var(--color-text-primary)',2.4)}</div><div class="grow"><div class="h3" style="font-size:18px">${title}</div>${sub?`<div class="s">${sub}</div>`:''}</div>${right}</div>`;
const mtitle=(title,right='')=>`<div class="mhead"><div class="h1 grow">${title}</div>${right}</div>`;
const sheet=(inner)=>`<div class="overlay"></div><div class="sheet"><div class="grab"></div>${inner}</div>`;
const sheetHead=(tone,n,ey,title)=>`<div class="row g16"><div class="tile lg t-${tone}" style="border-radius:50%">${ic(n,24,'currentColor',2.4)}</div><div class="grow"><div class="ey" style="color:inherit">${ey}</div><div class="h2" style="font-size:19px">${title}</div></div>${xbtn()}</div>`;

/* web */
const NAV=[['inicio','Inicio','home'],['misiones','Misiones','route'],['agenda','Agenda','calendar'],['tratamientos','Tratamientos','activity'],['docs','Documentos','file'],['mochilas','Mochilas','backpack'],['compartir','Compartir','share'],['dependientes','Dependientes','users'],['perfil','Perfil','user'],['ajustes','Configuración','settings']];
const side=sel=>`<aside class="side"><div class="lg">${logo(24)}</div>${NAV.map(([k,l,n])=>`<div class="nav ${k===sel?'on':''}">${ic(n,20,k===sel?'var(--color-brand-solid)':'var(--color-text-muted)')}${l}</div>`).join('')}<div class="grow"></div><div class="banner" style="background:var(--color-motivation-streak-bg);border:1px solid var(--color-motivation-streak-border);border-bottom-width:3px">${flame(28)}<div><div style="font:900 16px Nunito;color:var(--color-motivation-streak-text)">12 días</div><div class="s" style="color:var(--color-motivation-streak-edge)">Racha de check-in</div></div></div><div class="nav" style="margin-top:6px">${ic('logout',20,'var(--color-text-muted)')}Cerrar sesión</div></aside>`;
const wtop=(t,s,right)=>`<div class="wtop"><div class="grow"><div class="h1" style="font-size:24px">${t}</div>${s?`<div class="sub">${s}</div>`:''}</div>${right??(fchip()+chip('Nivel 4','am',star(14))+bellBtn()+avatar())}</div>`;
function web(o,inner){return `<div class="web ${o.over?'fix':''}">${side(o.sel)}<div class="wmain">${wtop(o.title,o.sub,o.right)}<div class="wct" style="${o.ct||''}">${inner}</div></div>${o.over||''}</div>`}
const webRaw=(inner,st='')=>`<div class="web" style="${st}">${inner}</div>`;
const wover=(inner,st='')=>`<div class="overlay"></div><div class="modal" style="${st}">${inner}</div>`;

/* registro de módulos */
const MODS=[];
function mod(id,title,desc){const m={id,title,desc,mob:[],web:[]};MODS.push(m);return {m:(n,h,nt='')=>m.mob.push({n,h,nt}),w:(n,h,nt='')=>m.web.push({n,h,nt})}}
function renderCanvas(){const q=new URLSearchParams(location.search).get('m');const list=MODS.filter(x=>!q||q.split(',').includes(x.id));document.getElementById('canvas').innerHTML=list.map(x=>`<section class="mod" id="m-${x.id}"><h1>${x.title}</h1><p>${x.desc}</p>${x.mob.length?`<div class="plat">Móvil</div><div class="rowm">${x.mob.map(s=>`<div class="scr"><div class="nm">${s.n}</div>${s.nt?`<div class="nt">${s.nt}</div>`:''}${s.h}</div>`).join('')}</div>`:''}${x.web.length?`<div class="plat">Web</div><div class="roww">${x.web.map(s=>`<div class="scr"><div class="nm">${s.n}</div>${s.nt?`<div class="nt">${s.nt}</div>`:''}${s.h}</div>`).join('')}</div>`:''}</section>`).join('')}

/* zoom del lienzo: ?z=0.5 o los botones de arriba a la derecha (se recuerda) */
function setZoom(z){const c=document.getElementById('canvas');let w=c.parentElement;if(!w.classList.contains('zwrap')){w=document.createElement('div');w.className='zwrap';c.parentNode.insertBefore(w,c);w.appendChild(c)}c.style.transform=z===1?'':`scale(${z})`;w.style.width=Math.ceil(c.offsetWidth*z)+'px';w.style.height=Math.ceil(c.offsetHeight*z)+'px';document.querySelectorAll('.zbar button').forEach(b=>b.classList.toggle('on',+b.dataset.z===z));try{localStorage.setItem('helu-zoom',z)}catch(e){}}
function zoomBar(){if(location.hash.includes('figmacapture'))return;const b=document.createElement('div');b.className='zbar';b.innerHTML='<span>Zoom</span>'+[0.25,0.4,0.6,1].map(z=>`<button data-z="${z}">${Math.round(z*100)} %</button>`).join('');b.addEventListener('click',e=>{const z=+e.target.dataset.z;if(z)setZoom(z)});document.body.appendChild(b);let z=+(new URLSearchParams(location.search).get('z')||0);if(!z){try{z=+localStorage.getItem('helu-zoom')||1}catch(e){z=1}}setZoom(z)}
