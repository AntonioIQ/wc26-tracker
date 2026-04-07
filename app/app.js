// Datos se leen de GitHub raw (repo publico) con fallback a archivos locales
const GH_RAW = "https://raw.githubusercontent.com/AntonioIQ/wc26-tracker/main/data";
const DATA = {
  matches: `${GH_RAW}/matches.json`,
  results: `${GH_RAW}/results.json`,
  leaderboard: `${GH_RAW}/leaderboard.json`,
  overrides: `${GH_RAW}/overrides.json`,
  venues: `${GH_RAW}/venues.json`
};
const DATA_LOCAL = {
  matches: "./data/matches.json",
  results: "./data/results.json",
  leaderboard: "./data/leaderboard.json",
  overrides: "./data/overrides.json",
  venues: "./data/venues.json"
};
const FLAGS={"Mexico":"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷","Czechia":"🇨🇿","Canada":"🇨🇦","Bosnia and Herzegovina":"🇧🇦","Qatar":"🇶🇦","Switzerland":"🇨🇭","United States":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turkey":"🇹🇷","Brazil":"🇧🇷","Morocco":"🇲🇦","Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Germany":"🇩🇪","Curacao":"🇨🇼","Netherlands":"🇳🇱","Japan":"🇯🇵","Ivory Coast":"🇨🇮","Ecuador":"🇪🇨","Sweden":"🇸🇪","Tunisia":"🇹🇳","Spain":"🇪🇸","Cape Verde":"🇨🇻","Belgium":"🇧🇪","Egypt":"🇪🇬","Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾","Iran":"🇮🇷","New Zealand":"🇳🇿","France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴","Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴","Portugal":"🇵🇹","DR Congo":"🇨🇩","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷","Ghana":"🇬🇭","Panama":"🇵🇦","Uzbekistan":"🇺🇿","Colombia":"🇨🇴"};
const STAGES={"group":"Fase de Grupos","round-of-32":"Treintaidosavos","round-of-16":"Octavos","quarterfinal":"Cuartos","semifinal":"Semifinal","third-place":"3er Lugar","final":"Final"};
const STAGE_BADGE={"group":"badge-group","round-of-32":"badge-r32","round-of-16":"badge-r16","quarterfinal":"badge-qf","semifinal":"badge-sf","third-place":"badge-final","final":"badge-final"};
const STORAGE_KEY="quiniela-wc26-draft";
let currentUser=null, allMatches=[], venuesData=[];

async function fetchJson(u){
  try{
    const r=await fetch(u,{cache:"no-store"});
    if(!r.ok)throw new Error(`Error ${u}`);
    return r.json();
  }catch(e){
    // Fallback a archivo local si GitHub raw falla
    const localKey=Object.keys(DATA).find(k=>DATA[k]===u);
    if(localKey&&DATA_LOCAL[localKey]){
      const r2=await fetch(DATA_LOCAL[localKey],{cache:"no-store"});
      if(!r2.ok)throw new Error(`Error ${DATA_LOCAL[localKey]}`);
      return r2.json();
    }
    throw e;
  }
}
function fl(t){return FLAGS[t]||"🏳️"}
function fmtDate(u){if(!u)return"—";return new Intl.DateTimeFormat("es-MX",{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:true}).format(new Date(u))}
function fmtDay(u){if(!u)return"—";return new Intl.DateTimeFormat("es-MX",{weekday:"long",day:"numeric",month:"long"}).format(new Date(u))}
function fmtScore(s){return s!==null&&s!==undefined?String(s):"-"}
function slugify(v){return String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}

/* AUTH */
function initAuth(){
  document.getElementById("btn-login").addEventListener("click",()=>netlifyIdentity.open("login"));
  document.getElementById("btn-logout").addEventListener("click",()=>netlifyIdentity.logout());
  netlifyIdentity.on("login",u=>{currentUser=u;showApp();netlifyIdentity.close()});
  netlifyIdentity.on("logout",()=>{currentUser=null;showAuth()});
  const u=netlifyIdentity.currentUser();
  if(u){currentUser=u;showApp()}else{showAuth()}
}
function showAuth(){document.getElementById("auth-screen").style.display="";document.getElementById("app-main").style.display="none"}
function showApp(){document.getElementById("auth-screen").style.display="none";document.getElementById("app-main").style.display="";document.getElementById("user-display").textContent="👤 "+(currentUser?.user_metadata?.full_name||currentUser?.email||"Jugador");boot()}

/* TABS */
function initTabs(){
  const tabs=document.querySelectorAll(".nav-tab");
  tabs.forEach(t=>t.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.tab).classList.add("active");
    if(t.dataset.tab==="tab-venues")setTimeout(()=>initMap(),100);
  }));
}

/* PODIUM */
function renderPodium(lb,matches){
  const container=document.getElementById("podium");
  const entries=lb.entries||[];
  const hasResults=matches.some(m=>m.displayStatus==="finished");

  if(!hasResults){
    const firstMatch=matches.filter(m=>m.kickoffUtc).sort((a,b)=>a.kickoffUtc.localeCompare(b.kickoffUtc))[0];
    if(firstMatch){
      const diff=Date.parse(firstMatch.kickoffUtc)-Date.now();
      if(diff>0){
        const days=Math.floor(diff/(1000*60*60*24));
        const hrs=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
        container.innerHTML=`<div class="podium-countdown">⏳ Faltan <strong>${days} días y ${hrs} horas</strong> para el inicio<br><span style="font-size:0.78rem">${fl(firstMatch.homeTeam)} ${firstMatch.homeTeam} vs ${firstMatch.awayTeam} ${fl(firstMatch.awayTeam)}</span></div>`;
        return;
      }
    }
  }

  if(!entries.length||entries.every(e=>e.totalPoints===0&&!hasResults)){
    container.innerHTML=`<div class="podium-countdown">🏆 ${entries.length} jugadores registrados · Esperando resultados</div>`;
    return;
  }

  const medals=["gold","silver","bronze"];
  const icons=["🥇","🥈","🥉"];
  const top=entries.slice(0,3);
  // Show in order: silver(1), gold(0), bronze(2) for visual podium effect
  const order=top.length>=3?[top[1],top[0],top[2]]:top.length===2?[top[1],top[0]]:[top[0]];
  const orderIdx=top.length>=3?[1,0,2]:top.length===2?[1,0]:[0];

  container.innerHTML=order.map((e,i)=>{
    const idx=orderIdx[i];
    return `<div class="podium-card ${medals[idx]}"><span class="podium-medal">${icons[idx]}</span><span class="podium-name">${e.displayName}</span><span class="podium-pts">${e.totalPoints} pts</span></div>`;
  }).join("");
}

/* TOURNAMENT FOOTER STATS */
function renderFooterStats(matches){
  const container=document.getElementById("tournament-footer");
  const finished=matches.filter(m=>m.displayStatus==="finished");
  const totalGoals=finished.reduce((s,m)=>{
    const h=m.result?.homeScore||0,a=m.result?.awayScore||0;
    return s+h+a;
  },0);

  let bestMatch=null,bestGoals=0;
  finished.forEach(m=>{
    const g=(m.result?.homeScore||0)+(m.result?.awayScore||0);
    if(g>bestGoals){bestGoals=g;bestMatch=m}
  });

  const teamGoals={};
  finished.forEach(m=>{
    if(m.result?.homeScore!=null){
      teamGoals[m.homeTeam]=(teamGoals[m.homeTeam]||0)+m.result.homeScore;
      teamGoals[m.awayTeam]=(teamGoals[m.awayTeam]||0)+m.result.awayScore;
    }
  });
  const topTeam=Object.entries(teamGoals).sort((a,b)=>b[1]-a[1])[0];

  if(!finished.length){
    container.innerHTML=`<p class="tournament-footer-title">Mundial 2026</p><div class="footer-stats">
      <div class="footer-stat"><p class="footer-stat-value">48</p><p class="footer-stat-label">Equipos</p></div>
      <div class="footer-stat"><p class="footer-stat-value">16</p><p class="footer-stat-label">Sedes</p></div>
      <div class="footer-stat"><p class="footer-stat-value">104</p><p class="footer-stat-label">Partidos</p></div>
      <div class="footer-stat"><p class="footer-stat-value">3</p><p class="footer-stat-label">Países</p></div>
    </div>`;
    return;
  }

  container.innerHTML=`<p class="tournament-footer-title">Stats del Torneo</p><div class="footer-stats">
    <div class="footer-stat"><p class="footer-stat-value">${finished.length}/${matches.length}</p><p class="footer-stat-label">Partidos</p></div>
    <div class="footer-stat"><p class="footer-stat-value">${totalGoals}</p><p class="footer-stat-label">Goles</p></div>
    <div class="footer-stat"><p class="footer-stat-value">${finished.length?((totalGoals/finished.length).toFixed(1)):"—"}</p><p class="footer-stat-label">Goles/Partido</p></div>
    <div class="footer-stat"><p class="footer-stat-value">${bestMatch?`${bestGoals} ⚽`:"—"}</p><p class="footer-stat-label">${bestMatch?`${bestMatch.homeTeam} vs ${bestMatch.awayTeam}`:"Más goles"}</p></div>
    <div class="footer-stat"><p class="footer-stat-value">${topTeam?`${fl(topTeam[0])} ${topTeam[1]}`:"—"}</p><p class="footer-stat-label">${topTeam?"Más goleador":"Top goleador"}</p></div>
  </div>`;
}

/* GROUPS */
function renderGroups(matches){
  const container=document.getElementById("tab-groups");
  const groupMatches=matches.filter(m=>m.stage==="group");
  const groups={};
  groupMatches.forEach(m=>{const g=m.group||"?";if(!groups[g])groups[g]=[];groups[g].push(m)});

  let html='<div class="groups-grid">';
  for(const[g,items]of Object.entries(groups).sort(([a],[b])=>a.localeCompare(b))){
    const teams=buildStandings(items);
    html+=`<div class="group-card">
      <div class="group-card-header"><span>Grupo ${g}</span><span style="font-size:0.75rem">${teams.map(t=>fl(t.name)).join(" ")}</span></div>
      <table class="group-standings"><thead><tr><th></th><th></th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th class="pts">Pts</th></tr></thead><tbody>`;
    teams.forEach((t,i)=>{
      const cls=i<2?"qualify":"";
      html+=`<tr class="${cls}"><td class="pos">${i+1}</td><td class="team-cell"><span class="flag">${fl(t.name)}</span>${t.name}</td><td>${t.pj}</td><td>${t.g}</td><td>${t.e}</td><td>${t.p}</td><td>${t.gf}</td><td>${t.gc}</td><td class="pts">${t.pts}</td></tr>`;
    });
    html+=`</tbody></table><div class="group-matches">`;
    items.forEach(m=>{
      html+=`<div class="group-match"><span class="gm-home">${fl(m.homeTeam)} ${m.homeTeam}</span><span class="gm-score">${fmtScore(m.result?.homeScore)} - ${fmtScore(m.result?.awayScore)}</span><span class="gm-away">${m.awayTeam} ${fl(m.awayTeam)}</span></div>`;
    });
    html+=`</div></div>`;
  }
  html+="</div>";
  container.innerHTML=html;
}

function buildStandings(matches){
  const t={};
  matches.forEach(m=>{
    [m.homeTeam,m.awayTeam].forEach(n=>{if(!t[n])t[n]={name:n,pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0}});
    if(m.result?.homeScore===null||m.result?.homeScore===undefined)return;
    const h=m.result.homeScore,a=m.result.awayScore;
    t[m.homeTeam].pj++;t[m.awayTeam].pj++;
    t[m.homeTeam].gf+=h;t[m.homeTeam].gc+=a;
    t[m.awayTeam].gf+=a;t[m.awayTeam].gc+=h;
    if(h>a){t[m.homeTeam].g++;t[m.homeTeam].pts+=3;t[m.awayTeam].p++}
    else if(h<a){t[m.awayTeam].g++;t[m.awayTeam].pts+=3;t[m.homeTeam].p++}
    else{t[m.homeTeam].e++;t[m.homeTeam].pts++;t[m.awayTeam].e++;t[m.awayTeam].pts++}
  });
  return Object.values(t).sort((a,b)=>b.pts-a.pts||(b.gf-b.gc)-(a.gf-a.gc)||b.gf-a.gf);
}

/* CALENDAR */
function renderCalendar(matches){
  const byDay={};
  matches.forEach(m=>{const d=m.kickoffUtc?m.kickoffUtc.slice(0,10):"tbd";if(!byDay[d])byDay[d]=[];byDay[d].push(m)});
  const days=Object.keys(byDay).sort();
  const filters=document.getElementById("calendar-filters");
  const list=document.getElementById("calendar-list");
  filters.innerHTML=`<button class="cal-btn active" data-day="all">Todos</button>`+days.map(d=>`<button class="cal-btn" data-day="${d}">${fmtDay(d+"T12:00:00Z")}</button>`).join("");
  function show(day){
    const filtered=day==="all"?days:days.filter(d=>d===day);
    list.innerHTML=filtered.map(d=>`<div class="cal-day-header">📅 ${fmtDay(d+"T12:00:00Z")}</div>`+byDay[d].map(m=>matchCardHTML(m)).join("")).join("");
  }
  show("all");
  filters.addEventListener("click",e=>{
    if(!e.target.classList.contains("cal-btn"))return;
    filters.querySelectorAll(".cal-btn").forEach(b=>b.classList.remove("active"));
    e.target.classList.add("active");
    show(e.target.dataset.day);
  });
}

function matchCardHTML(m){
  const stageLabel=m.stage==="group"?`Grupo ${m.group}`:(STAGES[m.stage]||m.stage);
  const badgeCls=STAGE_BADGE[m.stage]||"badge-scheduled";
  const statusCls=m.displayStatus==="live"?"badge-live":m.displayStatus==="finished"?"badge-finished":"badge-scheduled";
  const statusTxt=m.displayStatus==="live"?"EN VIVO":m.displayStatus==="finished"?"FINAL":"PROG";
  const liveCls=m.displayStatus==="live"?" is-live":"";
  return `<article class="match-card${liveCls}">
    <div class="match-topline"><span class="badge ${badgeCls}">${stageLabel}</span><span class="badge ${statusCls}">${statusTxt}</span><span class="match-date">${fmtDate(m.kickoffUtc)}</span></div>
    <div class="teams-row">
      <div class="team-block home"><span class="team-flag">${fl(m.homeTeam)}</span><span class="team-name">${m.homeTeam}</span></div>
      <div class="score-display"><span>${fmtScore(m.result?.homeScore)}</span><span class="sep">-</span><span>${fmtScore(m.result?.awayScore)}</span></div>
      <div class="team-block away"><span class="team-flag">${fl(m.awayTeam)}</span><span class="team-name">${m.awayTeam}</span></div>
    </div>
    <p class="match-venue-line">${m.venue||"Sede por confirmar"}</p>
  </article>`;
}

/* BRACKET */
function renderBracket(matches){
  const container=document.getElementById("bracket-container");
  const rounds=[
    {key:"round-of-32",label:"🏟️ Treintaidosavos de Final"},
    {key:"round-of-16",label:"⚔️ Octavos de Final"},
    {key:"quarterfinal",label:"🔥 Cuartos de Final"},
    {key:"semifinal",label:"⭐ Semifinales"},
    {key:"third-place",label:"🥉 Tercer Lugar"},
    {key:"final",label:"🏆 FINAL"}
  ];
  container.innerHTML=rounds.map(r=>{
    const rm=matches.filter(m=>m.stage===r.key);
    if(!rm.length)return"";
    return `<div class="bracket-round"><div class="bracket-round-title">${r.label}</div><div class="bracket-matches">${rm.map(m=>{
      const hw=m.result?.winner==="home",aw=m.result?.winner==="away";
      return `<div class="bracket-match"><div class="bm-teams">
        <div class="bm-team ${hw?"winner":""}"><span>${fl(m.homeTeam)} ${m.homeTeam}</span><span class="bm-score">${fmtScore(m.result?.homeScore)}</span></div>
        <div class="bm-team ${aw?"winner":""}"><span>${fl(m.awayTeam)} ${m.awayTeam}</span><span class="bm-score">${fmtScore(m.result?.awayScore)}</span></div>
      </div><div class="bm-meta">${fmtDate(m.kickoffUtc)} · ${m.venue||""}</div></div>`;
    }).join("")}</div></div>`;
  }).join("");
}

/* VENUES MAP */
let mapInstance=null;
function initMap(){
  if(mapInstance||!venuesData.length)return;
  mapInstance=L.map("venues-map").setView([35,-95],3);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:'© OpenStreetMap © CARTO',maxZoom:18}).addTo(mapInstance);
  venuesData.forEach(v=>{
    L.marker([v.lat,v.lng]).addTo(mapInstance).bindPopup(`<b>${v.flag} ${v.name}</b><br>${v.city}<br>Capacidad: ${v.capacity.toLocaleString()}<br><small>${v.description}</small>`);
  });
}

function renderVenues(venues){
  venuesData=venues;
  document.getElementById("venues-list").innerHTML=venues.map(v=>`<div class="venue-card">
    <h3>${v.flag} ${v.name}</h3>
    <p class="venue-city">${v.city}, ${v.country}</p>
    <p class="venue-cap">🏟️ Capacidad: ${v.capacity.toLocaleString()}</p>
    <p class="venue-desc">${v.description}</p>
  </div>`).join("");
}

/* LEADERBOARD */
function renderLeaderboard(entries,gen){
  const body=document.getElementById("leaderboard-body");
  if(!entries.length){body.innerHTML=`<tr><td colspan="3" class="empty-state">Sin participantes</td></tr>`;return}
  body.innerHTML=entries.map((e,i)=>{
    const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1;
    return `<tr><td class="rank-cell">${medal}</td><td>${e.displayName}<span class="player-id-cell"> · ${e.userId}</span></td><td class="points-cell">${e.totalPoints}</td></tr>`;
  }).join("");
  document.getElementById("leaderboard-updated").textContent=gen?`Actualizado: ${fmtDate(gen)}`:"";
}

/* PICKS */
function renderPickEditor(matches){
  const container=document.getElementById("pick-editor");
  const gm=matches.filter(m=>m.stage==="group");
  if(!gm.length){container.innerHTML=`<div class="empty-state">No hay partidos</div>`;return}
  const groups={};
  gm.forEach(m=>{const g=m.group||"?";if(!groups[g])groups[g]=[];groups[g].push(m)});
  container.innerHTML=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([g,items])=>`<div class="pick-section"><div class="pick-section-title">Grupo ${g}</div>${items.map(m=>{
    const locked=Date.parse(m.lockUtc)<=Date.now();
    return `<div class="pick-row ${locked?"locked":""}"><div class="pick-match-info"><p class="pick-match-title">${fl(m.homeTeam)} ${m.homeTeam} vs ${m.awayTeam} ${fl(m.awayTeam)}</p><p class="pick-match-meta">${fmtDate(m.kickoffUtc)}</p></div><div class="pick-inputs"><input class="pick-input" type="number" min="0" max="20" inputmode="numeric" data-match="${m.id}" data-side="home" ${locked?"disabled":""} aria-label="Goles ${m.homeTeam}"><span class="pick-sep">-</span><input class="pick-input" type="number" min="0" max="20" inputmode="numeric" data-match="${m.id}" data-side="away" ${locked?"disabled":""} aria-label="Goles ${m.awayTeam}"></div>${locked?'<span class="pick-lock-note">🔒</span>':""}</div>`;
  }).join("")}</div>`).join("");
  container.addEventListener("input",()=>updatePickSummary(gm),{passive:true});
}

function updatePickSummary(matches){
  const filled=matches.filter(m=>{const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`),a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`);return h&&a&&h.value!==""&&a.value!==""}).length;
  document.getElementById("pick-summary").innerHTML=`<strong>${filled}</strong> de <strong>${matches.length}</strong> picks capturados`;
  // Update pending indicator on tab
  const tab=document.querySelector('.tab-highlight');
  if(tab){filled<matches.length?tab.classList.add("has-pending"):tab.classList.remove("has-pending")}
}

function collectPicks(matches){
  return matches.filter(m=>m.stage==="group").map(m=>{const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`),a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`);return{matchId:m.id,homeScore:h&&h.value!==""?Number(h.value):null,awayScore:a&&a.value!==""?Number(a.value):null}});
}

function buildPickPayload(matches){
  const email=currentUser?.email||"anon",name=currentUser?.user_metadata?.full_name||email.split("@")[0];
  return{userId:slugify(name)||slugify(email),displayName:name,email,submittedAtUtc:new Date().toISOString(),picks:collectPicks(matches)};
}

function setStatus(msg,err){const el=document.getElementById("form-status");el.textContent=msg;el.className=err?"form-status error":"form-status"}

async function savePicks(matches){
  const payload=buildPickPayload(matches);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
  try{
    const token=currentUser?.token?.access_token;
    const res=await fetch("/.netlify/functions/save-picks",{method:"POST",headers:{"Content-Type":"application/json",...(token?{"Authorization":`Bearer ${token}`}:{})},body:JSON.stringify(payload)});
    if(!res.ok)throw new Error(await res.text());
    setStatus("✅ Picks guardados");
  }catch(e){setStatus("⚠️ Local OK. Error servidor: "+e.message,true)}
}

function loadDraft(matches){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;const d=JSON.parse(raw),pm=new Map((d.picks||[]).map(p=>[p.matchId,p]));
  matches.forEach(m=>{const p=pm.get(m.id);if(!p)return;const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`),a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`);if(h&&p.homeScore!==null)h.value=p.homeScore;if(a&&p.awayScore!==null)a.value=p.awayScore})}catch(e){}}

function downloadJson(fn,d){const b=new Blob([JSON.stringify(d,null,2)+"\n"],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}

/* MERGE */
function mergeData(matches,results,overrides){
  const bm=new Map(results.map(r=>[r.matchId,r])),om=new Map((overrides.results||[]).map(r=>[r.matchId,r]));
  return matches.map(m=>{const r=om.get(m.id)||bm.get(m.id)||{};return{...m,result:r,displayStatus:r.status||m.status||"scheduled"}});
}

/* BOOT */
async function boot(){
  try{
    const[md,rd,ld,od,vd]=await Promise.all([fetchJson(DATA.matches),fetchJson(DATA.results),fetchJson(DATA.leaderboard),fetchJson(DATA.overrides),fetchJson(DATA.venues)]);
    allMatches=mergeData(md.matches||[],rd.results||[],od);
    renderPodium(ld,allMatches);
    renderGroups(allMatches);
    renderCalendar(allMatches);
    renderBracket(allMatches);
    renderVenues(vd.venues||[]);
    renderLeaderboard(ld.entries||[],ld.generatedAtUtc);
    renderPickEditor(allMatches);
    loadDraft(allMatches);
    updatePickSummary(allMatches.filter(m=>m.stage==="group"));
    renderFooterStats(allMatches);
    document.getElementById("btn-save-picks").addEventListener("click",()=>savePicks(allMatches));
    document.getElementById("btn-export-picks").addEventListener("click",()=>{const p=buildPickPayload(allMatches);downloadJson(`pick-${p.userId}.json`,p);setStatus("📤 Exportado")});
    document.getElementById("btn-clear-picks").addEventListener("click",()=>{localStorage.removeItem(STORAGE_KEY);document.querySelectorAll(".pick-input").forEach(el=>{if(!el.disabled)el.value=""});updatePickSummary(allMatches.filter(m=>m.stage==="group"));setStatus("🗑️ Limpiado")});
  }catch(e){document.getElementById("app-main").innerHTML=`<div class="empty-state">⚠️ ${e.message}</div>`;console.error(e)}
}

initTabs();
initAuth();
