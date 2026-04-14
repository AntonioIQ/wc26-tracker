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
const PROFILE_KEY="quiniela-wc26-profile";
const AVATAR_OPTIONS=["⚽","🦁","🐯","🦅","🐉","🔥","⭐","💎","🎯","🏆","👑","🎩","🤖","🦈","🐺","🦂","🐢","🦉","🎪","🚀","🌮","🍕","🎸","🎲","💀","🧠","🦾","🫡"];
let currentUser=null, allMatches=[], venuesData=[];

/* WEATHER */
const WMO_ICONS={"0":"☀️","1":"🌤️","2":"⛅","3":"☁️","45":"🌫️","48":"🌫️","51":"🌦️","53":"🌦️","55":"🌧️","61":"🌧️","63":"🌧️","65":"🌧️","71":"🌨️","73":"🌨️","75":"🌨️","80":"🌦️","81":"🌧️","82":"⛈️","95":"⛈️","96":"⛈️","99":"⛈️"};
const WMO_DESC={"0":"Despejado","1":"Mayormente despejado","2":"Parcialmente nublado","3":"Nublado","45":"Neblina","48":"Neblina","51":"Llovizna ligera","53":"Llovizna","55":"Llovizna fuerte","61":"Lluvia ligera","63":"Lluvia","65":"Lluvia fuerte","71":"Nieve ligera","73":"Nieve","75":"Nieve fuerte","80":"Chubascos","81":"Chubascos fuertes","82":"Tormenta","95":"Tormenta eléctrica","96":"Tormenta con granizo","99":"Tormenta severa"};

async function fetchWeatherCurrent(lat,lng){
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto`);
    if(!r.ok)return null;
    return(await r.json()).current;
  }catch(e){return null}
}

async function fetchWeatherForDate(lat,lng,date,hour){
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weather_code&start_date=${date}&end_date=${date}&timezone=UTC`);
    if(!r.ok)return null;
    const d=await r.json();
    const idx=d.hourly?.time?.findIndex(t=>t.includes(`T${String(hour).padStart(2,"0")}:`));
    if(idx===-1||idx===undefined)return null;
    return{temp:d.hourly.temperature_2m[idx],code:d.hourly.weather_code[idx]};
  }catch(e){return null}
}

function weatherIcon(code){return WMO_ICONS[String(code)]||"🌡️"}
function weatherDesc(code){return WMO_DESC[String(code)]||""}

async function renderWeatherBar(){
  const el=document.getElementById("weather-bar");
  const w=await fetchWeatherCurrent(19.3029,-99.1505);
  if(!w){el.style.display="none";return}
  const icon=weatherIcon(w.weather_code);
  const desc=weatherDesc(w.weather_code);
  el.innerHTML=`<span class="weather-icon">${icon}</span><span class="weather-temp">${Math.round(w.temperature_2m)}°C</span><span class="weather-desc">${desc}</span><span class="weather-detail">💧 ${w.relative_humidity_2m}% · 💨 ${Math.round(w.wind_speed_10m)} km/h</span><span class="weather-loc">📍 Ciudad de México</span>`;
}


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
    const av=e.avatar||"⚽";
    return `<div class="podium-card ${medals[idx]}"><span class="podium-medal">${icons[idx]}</span><span style="font-size:1.5rem">${av}</span><span class="podium-name">${e.displayName}</span><span class="podium-pts">${e.totalPoints} pts</span></div>`;
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
  return `<article class="match-card${liveCls}" data-context-match="${m.id}">
    <div class="match-topline"><span class="badge ${badgeCls}">${stageLabel}</span><span class="badge ${statusCls}">${statusTxt}</span><span class="match-date">${fmtDate(m.kickoffUtc)}</span></div>
    <div class="teams-row">
      <div class="team-block home"><span class="team-flag">${fl(m.homeTeam)}</span><span class="team-name">${m.homeTeam}</span></div>
      <div class="score-display"><span>${fmtScore(m.result?.homeScore)}</span><span class="sep">-</span><span>${fmtScore(m.result?.awayScore)}</span></div>
      <div class="team-block away"><span class="team-flag">${fl(m.awayTeam)}</span><span class="team-name">${m.awayTeam}</span></div>
    </div>
    <div class="match-bottom"><p class="match-venue-line">${m.venue||"Sede por confirmar"}</p><span class="match-weather" data-match-weather="${m.id}"></span></div>
  </article>`;
}

async function loadMatchWeather(matches){
  const venueMap=new Map(venuesData.map(v=>[v.name,v]));
  const now=Date.now();
  const limit=16*24*60*60*1000;
  for(const m of matches.filter(m=>m.kickoffUtc&&m.displayStatus==="scheduled")){
    const diff=Date.parse(m.kickoffUtc)-now;
    if(diff<0||diff>limit)continue;
    const venueName=m.venue?.split(",")[0];
    const venue=venuesData.find(v=>m.venue?.includes(v.name)||v.name.includes(venueName));
    if(!venue)continue;
    const date=m.kickoffUtc.slice(0,10);
    const hour=parseInt(m.kickoffUtc.slice(11,13));
    const w=await fetchWeatherForDate(venue.lat,venue.lng,date,hour);
    if(!w)continue;
    const el=document.querySelector(`[data-match-weather="${m.id}"]`);
    if(el)el.innerHTML=`${weatherIcon(w.code)} ${Math.round(w.temp)}°C`;
  }
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
    const icon=L.divIcon({className:"venue-marker",html:`<span class="venue-marker-dot">${v.flag}</span>`,iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-18]});
    L.marker([v.lat,v.lng],{icon}).addTo(mapInstance).bindPopup(`<div style="font-family:system-ui;min-width:180px"><b style="font-size:14px">${v.flag} ${v.name}</b><br><span style="color:#666">${v.city}</span><br><span style="color:#888;font-size:12px">🏟️ ${v.capacity.toLocaleString()} personas</span><br><small style="color:#999;line-height:1.3;display:block;margin-top:4px">${v.description}</small></div>`);
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
    const av=e.avatar?`<span class="lb-avatar">${e.avatar}</span>`:"";
    const tag=e.tagline?`<span class="lb-tagline">${e.tagline}</span>`:"";
    return `<tr><td class="rank-cell">${medal}</td><td>${av}${e.displayName}${tag}</td><td class="points-cell">${e.totalPoints}</td></tr>`;
  }).join("");
  document.getElementById("leaderboard-updated").textContent=gen?`Actualizado: ${fmtDate(gen)}`:"";
}

/* PICKS */
function renderPickEditor(matches){
  const container=document.getElementById("pick-editor");
  const gm=matches.filter(m=>m.stage==="group");
  const ko=matches.filter(m=>m.stage!=="group");

  if(!gm.length&&!ko.length){container.innerHTML=`<div class="empty-state">No hay partidos</div>`;return}

  let html="";

  // Fase de grupos
  if(gm.length){
    const groups={};
    gm.forEach(m=>{const g=m.group||"?";if(!groups[g])groups[g]=[];groups[g].push(m)});
    html+=Object.entries(groups).sort(([a],[b])=>a.localeCompare(b)).map(([g,items])=>`<div class="pick-section"><div class="pick-section-title">Grupo ${g}</div>${items.map(m=>pickRowHTML(m,false)).join("")}</div>`).join("");
  }

  // Fase eliminatoria
  const koStages=["round-of-32","round-of-16","quarterfinal","semifinal","third-place","final"];
  const koLabels={"round-of-32":"Treintaidosavos","round-of-16":"Octavos","quarterfinal":"Cuartos","semifinal":"Semifinales","third-place":"3er Lugar","final":"Final"};
  for(const stage of koStages){
    const sm=ko.filter(m=>m.stage===stage);
    if(!sm.length)continue;
    html+=`<div class="pick-section"><div class="pick-section-title">${koLabels[stage]||stage}</div>${sm.map(m=>pickRowHTML(m,true)).join("")}</div>`;
  }

  container.innerHTML=html;
  const allPickable=[...gm,...ko];
  container.addEventListener("input",()=>updatePickSummary(allPickable),{passive:true});
}

function pickRowHTML(m,isKnockout){
  const locked=Date.parse(m.lockUtc)<=Date.now();
  const qualifiedHtml=isKnockout?`<div class="pick-qualified"><label class="pick-qualified-label">Clasifica:</label><select class="pick-qualified-select" data-match-qualified="${m.id}" ${locked?"disabled":""}><option value="">—</option><option value="home">${fl(m.homeTeam)} ${m.homeTeam}</option><option value="away">${fl(m.awayTeam)} ${m.awayTeam}</option></select></div>`:"";
  return `<div class="pick-row ${locked?"locked":""}"><div class="pick-match-info"><p class="pick-match-title">${fl(m.homeTeam)} ${m.homeTeam} vs ${m.awayTeam} ${fl(m.awayTeam)}</p><p class="pick-match-meta">${fmtDate(m.kickoffUtc)}${isKnockout?' · <span class="pick-ko-badge">Eliminatoria</span>':""}</p></div><div class="pick-inputs"><input class="pick-input" type="number" min="0" max="20" inputmode="numeric" data-match="${m.id}" data-side="home" ${locked?"disabled":""} aria-label="Goles ${m.homeTeam}"><span class="pick-sep">-</span><input class="pick-input" type="number" min="0" max="20" inputmode="numeric" data-match="${m.id}" data-side="away" ${locked?"disabled":""} aria-label="Goles ${m.awayTeam}"></div>${qualifiedHtml}${locked?'<span class="pick-lock-note">🔒</span>':""}</div>`;
}

function updatePickSummary(matches){
  const filled=matches.filter(m=>{const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`),a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`);return h&&a&&h.value!==""&&a.value!==""}).length;
  document.getElementById("pick-summary").innerHTML=`<strong>${filled}</strong> de <strong>${matches.length}</strong> picks capturados`;
  const tab=document.querySelector('.tab-highlight');
  if(tab){filled<matches.length?tab.classList.add("has-pending"):tab.classList.remove("has-pending")}
}

function collectPicks(matches){
  return matches.map(m=>{
    const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`);
    const a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`);
    const q=document.querySelector(`[data-match-qualified="${m.id}"]`);
    const pick={matchId:m.id,homeScore:h&&h.value!==""?Number(h.value):null,awayScore:a&&a.value!==""?Number(a.value):null};
    if(q&&q.value)pick.qualifiedTeam=q.value;
    return pick;
  });
}

function getStableUserId(){
  // Prefer Netlify Identity sub (stable), fallback to slugified email
  return currentUser?.id||slugify(currentUser?.email)||"anon";
}

function getProfile(){
  try{const raw=localStorage.getItem(PROFILE_KEY);return raw?JSON.parse(raw):{}}catch(e){return{}}
}

function saveProfile(profile){
  localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));
}

function buildPickPayload(matches){
  const profile=getProfile();
  const email=currentUser?.email||"anon";
  const defaultName=currentUser?.user_metadata?.full_name||email.split("@")[0];
  return{userId:getStableUserId(),displayName:profile.displayName||defaultName,avatar:profile.avatar||"⚽",tagline:profile.tagline||"",email,submittedAtUtc:new Date().toISOString(),picks:collectPicks(matches)};
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
  matches.forEach(m=>{const p=pm.get(m.id);if(!p)return;const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`),a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`),q=document.querySelector(`[data-match-qualified="${m.id}"]`);if(h&&p.homeScore!==null)h.value=p.homeScore;if(a&&p.awayScore!==null)a.value=p.awayScore;if(q&&p.qualifiedTeam)q.value=p.qualifiedTeam})}catch(e){}}

async function syncPicksFromRepo(matches){
  if(!currentUser)return;
  const userId=getStableUserId();
  if(!userId)return;
  try{
    const url=`${GH_RAW}/picks/${userId}.json`;
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok)return;
    const remote=await r.json();
    const local=localStorage.getItem(STORAGE_KEY);
    const localData=local?JSON.parse(local):null;
    // Use remote if it's newer or local doesn't exist
    const remoteTime=Date.parse(remote.submittedAtUtc||"2000-01-01");
    const localTime=localData?Date.parse(localData.submittedAtUtc||"2000-01-01"):0;
    if(remoteTime>=localTime){
      localStorage.setItem(STORAGE_KEY,JSON.stringify(remote));
      const pm=new Map((remote.picks||[]).map(p=>[p.matchId,p]));
      matches.forEach(m=>{const p=pm.get(m.id);if(!p)return;
        const h=document.querySelector(`[data-match="${m.id}"][data-side="home"]`),a=document.querySelector(`[data-match="${m.id}"][data-side="away"]`),q=document.querySelector(`[data-match-qualified="${m.id}"]`);
        if(h&&!h.disabled&&p.homeScore!==null)h.value=p.homeScore;
        if(a&&!a.disabled&&p.awayScore!==null)a.value=p.awayScore;
        if(q&&!q.disabled&&p.qualifiedTeam)q.value=p.qualifiedTeam;
      });
      updatePickSummary(matches);
    }
  }catch(e){/* fallback to localStorage, already loaded */}
}

function initProfileEditor(){
  const profile=getProfile();
  const nameInput=document.getElementById("profile-name");
  const taglineInput=document.getElementById("profile-tagline");
  const avatarBtn=document.getElementById("btn-avatar");
  const picker=document.getElementById("avatar-picker");

  // Set defaults
  const defaultName=currentUser?.user_metadata?.full_name||currentUser?.email?.split("@")[0]||"";
  nameInput.value=profile.displayName||defaultName;
  taglineInput.value=profile.tagline||"";
  avatarBtn.textContent=profile.avatar||"⚽";

  // Render avatar picker
  picker.innerHTML=AVATAR_OPTIONS.map(a=>`<button class="avatar-option ${a===(profile.avatar||"⚽")?"selected":""}" data-av="${a}">${a}</button>`).join("");

  avatarBtn.addEventListener("click",()=>{picker.style.display=picker.style.display==="none"?"flex":"none"});

  picker.addEventListener("click",(e)=>{
    const btn=e.target.closest("[data-av]");
    if(!btn)return;
    const av=btn.dataset.av;
    avatarBtn.textContent=av;
    picker.querySelectorAll(".avatar-option").forEach(b=>b.classList.remove("selected"));
    btn.classList.add("selected");
    const p=getProfile();p.avatar=av;saveProfile(p);
    picker.style.display="none";
  });

  nameInput.addEventListener("change",()=>{const p=getProfile();p.displayName=nameInput.value.trim()||defaultName;saveProfile(p)});
  taglineInput.addEventListener("change",()=>{const p=getProfile();p.tagline=taglineInput.value.trim();saveProfile(p)});
}

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
    initProfileEditor();
    loadDraft(allMatches);
    syncPicksFromRepo(allMatches);
    updatePickSummary(allMatches);
    renderFooterStats(allMatches);
    renderWeatherBar();
    loadMatchWeather(allMatches);
    // Event delegation for match context drawer
    document.addEventListener("click",(e)=>{
      const card=e.target.closest("[data-context-match]");
      if(!card)return;
      const matchId=card.dataset.contextMatch;
      const match=allMatches.find(m=>m.id===matchId);
      if(match)openMatchContext(match);
    });
    document.getElementById("btn-save-picks").addEventListener("click",()=>savePicks(allMatches));
    document.getElementById("btn-export-picks").addEventListener("click",()=>{const p=buildPickPayload(allMatches);downloadJson(`pick-${p.userId}.json`,p);setStatus("📤 Exportado")});
    document.getElementById("btn-clear-picks").addEventListener("click",()=>{localStorage.removeItem(STORAGE_KEY);document.querySelectorAll(".pick-input").forEach(el=>{if(!el.disabled)el.value=""});document.querySelectorAll(".pick-qualified-select").forEach(el=>{if(!el.disabled)el.value=""});updatePickSummary(allMatches);setStatus("🗑️ Limpiado")});
  }catch(e){document.getElementById("app-main").innerHTML=`<div class="empty-state">⚠️ ${e.message}</div>`;console.error(e)}
}

/* MATCH CONTEXT DRAWER */
const PERIODISTAS_MAP={"davidfaitelson_":{name:"David Faitelson",initials:"DF"},"cmabortin":{name:"Christian Martinoli",initials:"CM"},"luisgarciaPlays":{name:"Luis García",initials:"LG"},"meabortin":{name:"David Medrano",initials:"DM"},"aztecadeportes":{name:"Azteca Deportes",initials:"AD"},"tudnmex":{name:"TUDN MEX",initials:"TU"},"josramnfernndez1":{name:"José Ramón Fdez.",initials:"JR"}};

function initContextDrawer(){
  const overlay=document.getElementById("context-overlay");
  const drawer=document.getElementById("context-drawer");
  const closeBtn=document.getElementById("context-close");

  function close(){overlay.classList.remove("open");drawer.classList.remove("open")}
  overlay.addEventListener("click",close);
  closeBtn.addEventListener("click",close);

  document.querySelectorAll(".context-tab").forEach(t=>t.addEventListener("click",()=>{
    document.querySelectorAll(".context-tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".context-panel").forEach(p=>p.classList.remove("active"));
    t.classList.add("active");
    document.getElementById(t.dataset.ctab).classList.add("active");
  }));
}

function openMatchContext(match){
  const overlay=document.getElementById("context-overlay");
  const drawer=document.getElementById("context-drawer");
  document.getElementById("context-title").textContent=`${fl(match.homeTeam)} ${match.homeTeam} vs ${match.awayTeam} ${fl(match.awayTeam)}`;
  overlay.classList.add("open");
  drawer.classList.add("open");

  // Reset tabs to live
  document.querySelectorAll(".context-tab").forEach(t=>t.classList.remove("active"));
  document.querySelectorAll(".context-panel").forEach(p=>p.classList.remove("active"));
  document.querySelector('[data-ctab="ctx-live"]').classList.add("active");
  document.getElementById("ctx-live").classList.add("active");

  renderCtxLive(match);
  loadCtxLineups(match);
  loadCtxCommentary(match);
}

function renderCtxLive(m){
  const el=document.getElementById("ctx-live");
  const hs=fmtScore(m.result?.homeScore),as=fmtScore(m.result?.awayScore);
  const statusTxt=m.displayStatus==="live"?"🟢 EN VIVO":m.displayStatus==="finished"?"FINAL":fmtDate(m.kickoffUtc);
  const statusCls=m.displayStatus==="finished"?"finished":"";
  el.innerHTML=`<div class="ctx-score-card">
    <div class="ctx-teams">
      <div class="ctx-team"><span class="team-flag" style="font-size:2.5rem">${fl(m.homeTeam)}</span><span class="ctx-team-name">${m.homeTeam}</span></div>
      <div class="ctx-score">${hs} - ${as}</div>
      <div class="ctx-team"><span class="team-flag" style="font-size:2.5rem">${fl(m.awayTeam)}</span><span class="ctx-team-name">${m.awayTeam}</span></div>
    </div>
    <p class="ctx-status ${statusCls}">${statusTxt}</p>
    <p class="ctx-venue">🏟️ ${m.venue||"Sede por confirmar"}</p>
  </div>`;
}

async function callContext(body){
  const r=await fetch("/.netlify/functions/match-context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(await r.text());
  return r.json();
}

async function loadCtxLineups(match){
  const el=document.getElementById("ctx-lineups");
  el.innerHTML='<div class="ctx-loading"><div class="ctx-spinner"></div>Cargando alineaciones...</div>';

  try{
    // Find ESPN event by searching scoreboard
    const sb=await callContext({action:"scoreboard",league:"fifa.world"});
    const events=sb.events||[];
    const homeLower=match.homeTeam.toLowerCase();
    const awayLower=match.awayTeam.toLowerCase();
    const evt=events.find(e=>{
      const comp=e.competitions?.[0];
      if(!comp)return false;
      const h=(comp.competitors?.find(c=>c.homeAway==="home")?.team?.displayName||"").toLowerCase();
      const a=(comp.competitors?.find(c=>c.homeAway==="away")?.team?.displayName||"").toLowerCase();
      return(h.includes(homeLower)||homeLower.includes(h))&&(a.includes(awayLower)||awayLower.includes(a));
    });

    if(!evt){el.innerHTML='<div class="ctx-empty"><div class="ctx-empty-icon">👕</div>Alineaciones no disponibles.<br><small>Se publican poco antes del inicio.</small></div>';return}

    const data=await callContext({action:"summary",league:"fifa.world",eventId:evt.id});
    if(!data.lineups||!data.lineups.length){el.innerHTML='<div class="ctx-empty"><div class="ctx-empty-icon">👕</div>Alineaciones aún no confirmadas.</div>';return}

    el.innerHTML=data.lineups.map(t=>`<div class="ctx-lineup-team">
      <div class="ctx-lineup-header">${t.teamLogo?`<img src="${t.teamLogo}" alt="">`:""}<span class="ctx-lineup-name">${t.teamName}</span>${t.formation?`<span class="ctx-formation">${t.formation}</span>`:""}</div>
      <div class="ctx-section-label">Titulares</div>
      ${t.starters.map(p=>playerHTML(p)).join("")}
      ${t.subs.length?`<div class="ctx-section-label">Suplentes</div>${t.subs.map(p=>playerHTML(p)).join("")}`:""}
    </div>`).join("");
  }catch(e){
    el.innerHTML=`<div class="ctx-empty"><div class="ctx-empty-icon">⚠️</div>Error: ${e.message}</div>`;
  }
}

function playerHTML(p){
  let events="";
  if(p.subbedIn)events+="🔼";if(p.subbedOut)events+="🔽";
  if(p.yellowCard)events+="🟨";if(p.redCard)events+="🟥";
  return `<div class="ctx-player"><span class="ctx-player-num">${p.number}</span><span class="ctx-player-name">${p.name}</span><span class="ctx-player-events">${events}</span>${p.position?`<span class="ctx-player-pos">${p.position}</span>`:""}</div>`;
}

async function loadCtxCommentary(match){
  const el=document.getElementById("ctx-commentary");
  el.innerHTML='<div class="ctx-loading"><div class="ctx-spinner"></div>Buscando comentarios...</div>';

  try{
    const data=await callContext({action:"commentary",teams:[match.homeTeam,match.awayTeam]});
    if(!data.available){el.innerHTML='<div class="ctx-empty"><div class="ctx-empty-icon">📺</div>Comentarios no disponibles.<br><small>Xpoz no está configurado.</small></div>';return}
    if(!data.posts||!data.posts.length){el.innerHTML='<div class="ctx-empty"><div class="ctx-empty-icon">🤷</div>Sin comentarios recientes sobre este partido.</div>';return}

    el.innerHTML=data.posts.map(p=>{
      const handle=(p.author||"").toLowerCase();
      const info=Object.entries(PERIODISTAS_MAP).find(([k])=>handle.includes(k));
      const name=info?info[1].name:p.author;
      const initials=info?info[1].initials:"??";
      return `<div class="ctx-tweet">
        <div class="ctx-tweet-author"><div class="ctx-tweet-avatar">${initials}</div><div><div class="ctx-tweet-name">${name}</div><div class="ctx-tweet-handle">@${p.author}</div></div></div>
        <div class="ctx-tweet-text">${p.text}</div>
        <div class="ctx-tweet-meta"><span>❤️ ${p.likes||0}</span><span>🔄 ${p.retweets||0}</span></div>
      </div>`;
    }).join("");
  }catch(e){
    el.innerHTML=`<div class="ctx-empty"><div class="ctx-empty-icon">⚠️</div>Error: ${e.message}</div>`;
  }
}

function initRulesModal(){
  const overlay=document.getElementById("rules-overlay");
  const closeBtn=document.getElementById("rules-close");
  const openBtn=document.getElementById("btn-rules");
  openBtn.addEventListener("click",()=>overlay.classList.add("open"));
  closeBtn.addEventListener("click",()=>overlay.classList.remove("open"));
  overlay.addEventListener("click",(e)=>{if(e.target===overlay)overlay.classList.remove("open")});
}

initRulesModal();
initContextDrawer();
initTabs();
initAuth();
