const _=document;
const $=id=>_.getElementById(id);

const _sb=$("searchBtn"),_si=$("searchInput"),_rb=$("resultsBody"),_es=$("emptyState"),_st=$("statusText"),_pg=$("progressBar"),_pc=$("progressContainer");
const _pt=$("playerTitle"),_pc2=$("playerChannel"),_pth=$("playerThumb"),_ct=$("playerCurrentTime"),_dr=$("playerDuration"),_ppw=$("playerProgressWrap"),_ppf=$("playerProgressFilled"),_ppt=$("playerProgressThumb");
const _bp=$("btnPlayPause"),_bv=$("btnPrev"),_bn=$("btnNext"),_bm=$("btnMute"),_vl=$("playerVolume");
const _sm=$("setupModal"),_aki=$("apiKeyInput"),_me=$("modalError"),_ms=$("modalSubmit"),_ml=$("modalLink");
const _sp=$("statusPanel"),_spb=$("statusPanelBody"),_sbf=$("statusBarFill");

let R=[],SI=-1,AP=null,CPI=null,ISK=false;

$("btn-minimize").onclick=()=>window.api.minimize();
$("btn-maximize").onclick=()=>window.api.maximize();
$("btn-close").onclick=()=>window.api.close();

document.querySelectorAll(".tab-btn").forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    $("tab-"+b.dataset.tab).classList.add("active");
    if(b.dataset.tab==="downloads")loadDl();
  };
});

_sb.onclick=doSearch;
_si.onkeydown=e=>{if(e.key==="Enter")doSearch();};
document.querySelectorAll(".suggestion-chip").forEach(c=>{c.onclick=()=>{_si.value=c.dataset.q;doSearch();};});

async function doSearch(){
  const q=_si.value.trim();if(!q)return;
  setStatus("Searching: "+q+" ...");showProg(30);
  _sb.disabled=true;_sb.textContent="...";_rb.innerHTML="";_es.style.display="none";R=[];SI=-1;
  try{R=await window.api.search(q);await markDl();render();setStatus("Found "+R.length+" results for '"+q+"'");showProg(100);}
  catch(e){setStatus("Error: "+e.message);showProg(0);_es.style.display="flex";}
  finally{_sb.disabled=false;_sb.textContent="SEARCH";}
}

async function markDl(){for(let i=0;i<R.length;i++){const u=getUrl(R[i]);if(!u)continue;try{const d=await window.api.isDownloaded(u);if(d){R[i]._dl=true;R[i]._fp=d.filePath;R[i]._fm=d.format;}}catch(e){}}}

function render(){
  _rb.innerHTML="";if(!R.length){_es.style.display="flex";return;}_es.style.display="none";
  R.forEach((it,i)=>{
    const tr=_.createElement("tr");tr.dataset.index=i;if(i===SI)tr.classList.add("selected");
    const th=it.thumbnail?'<img class="thumb-img" src="'+esc(it.thumbnail)+'" alt="" onerror="this.style.display=\'none\'" />':"";
    const bd=it._dl?'<span class="dl-badge">&#10003; DL</span>':"";
    let ac;
    if(it._dl)ac='<button class="action-btn btn-play" data-action="play">&#9654; Play</button><button class="action-btn btn-local" data-action="local">&#128190; Local</button>';
    else ac='<button class="action-btn btn-play" data-action="play">&#9654; Play</button><button class="action-btn btn-mp3" data-action="mp3">MP3</button><button class="action-btn btn-mp4" data-action="mp4">MP4</button>';
    tr.innerHTML='<td class="col-num">'+(i+1)+'</td><td class="col-thumb">'+th+'</td><td class="col-title" title="'+esc(it.title)+'">'+esc(it.title)+bd+'</td><td class="col-duration">'+esc(it.duration)+'</td><td class="col-channel">'+esc(it.channel)+'</td><td class="col-actions">'+ac+'</td>';
    tr.onclick=e=>{if(e.target.closest(".action-btn"))return;selRow(i);};
    tr.ondblclick=()=>playItem(i);
    tr.querySelectorAll(".action-btn").forEach(b=>{b.onclick=e=>{e.stopPropagation();const a=b.dataset.action;if(a==="play")playItem(i);else if(a==="mp3")dlItem(i,"mp3");else if(a==="mp4")dlItem(i,"mp4");else if(a==="local")playLocal(i);};});
    _rb.appendChild(tr);
  });
}

function selRow(i){SI=i;document.querySelectorAll("#resultsBody tr").forEach((tr,j)=>tr.classList.toggle("selected",j===i));}
function getUrl(it){let u=it.url;if(!u&&it.id)u="https://www.youtube.com/watch?v="+it.id;return u;}

_bp.onclick=()=>{if(!AP)return;AP.paused?AP.play():AP.pause();};
_bv.onclick=()=>{if(!R.length)return;let i=SI-1;if(i<0)i=R.length-1;playItem(i);};
_bn.onclick=()=>{if(!R.length)return;let i=SI+1;if(i>=R.length)i=0;playItem(i);};
_bm.onclick=()=>{if(!AP)return;AP.muted=!AP.muted;_bm.innerHTML=AP.muted?"&#128264;":"&#128266;";};
_vl.oninput=()=>{if(!AP)return;AP.volume=_vl.value/100;_bm.innerHTML=AP.volume===0?"&#128264;":"&#128266;";};

_ppw.onmousedown=e=>{if(!AP||!AP.duration)return;ISK=true;seekTo(e);};
document.onmousemove=e=>{if(ISK)seekTo(e);};
document.onmouseup=()=>ISK=false;

function seekTo(e){if(!AP||!AP.duration)return;const r=_ppw.getBoundingClientRect();let p=(e.clientX-r.left)/r.width;p=Math.max(0,Math.min(1,p));AP.currentTime=p*AP.duration;updProg(p);}
function updProg(p){if(!_ppf||!_ppt)return;_ppf.style.width=(p*100)+"%";_ppt.style.left=(p*100)+"%";}
function fmtTime(s){if(!s||!isFinite(s))return"0:00";const m=Math.floor(s/60),sec=Math.floor(s%60);return m+":"+(sec<10?"0":"")+sec;}

function setupEv(){
  if(!AP)return;
  AP.ontimeupdate=()=>{if(!AP||ISK||!AP.duration)return;updProg(AP.currentTime/AP.duration);_ct.textContent=fmtTime(AP.currentTime);_dr.textContent=fmtTime(AP.duration);};
  AP.onloadedmetadata=()=>{if(!AP)return;_dr.textContent=fmtTime(AP.duration);};
  AP.onplay=()=>{_bp.innerHTML="&#9646;&#9646;";_bp.title="Pause";};
  AP.onpause=()=>{_bp.innerHTML="&#9654;";_bp.title="Play";};
  AP.onended=()=>{_bp.innerHTML="&#9654;";_bp.title="Play";_pt.classList.remove("animate");setStatus("Finished: "+(CPI?CPI.title:""));if(R.length>0&&SI>=0){let ni=SI+1;if(ni<R.length)setTimeout(()=>playItem(ni),500);}};
  AP.onerror=()=>{_bp.innerHTML="&#9654;";setStatus("Stream error.");};
}

function updUI(it,loc){
  CPI=it;const t=it.title||"Unknown",c=it.channel||"",b=loc?" (local)":"";
  _pt.textContent=t+b;_pc2.textContent=c;_pt.classList.remove("animate");void _pt.offsetWidth;
  if(t.length>25){_pt.textContent=(t+b)+"     \u2022     "+(t+b);requestAnimationFrame(()=>_pt.classList.add("animate"));}
  if(it.thumbnail)_pth.innerHTML='<img src="'+esc(it.thumbnail)+'" alt="" onerror="this.style.display=\'none\'" />';
  else _pth.innerHTML='<div class="player-thumb-placeholder">&#9835;</div>';
  _ct.textContent="0:00";_dr.textContent="0:00";updProg(0);_bp.innerHTML="&#9654;";
}

async function playItem(i){
  const it=R[i];if(!it)return;
  if(it._dl&&it._fp)return playLocal(i);
  selRow(i);const u=getUrl(it);if(!u){setStatus("No URL available for this video.");return;}
  const pb=document.querySelector('tr[data-index="'+i+'"] .btn-play');if(pb){pb.disabled=true;pb.textContent="...";}
  setStatus("Loading stream: "+it.title);showProg(20);updUI(it,false);
  if(AP){AP.pause();AP=null;}
  try{const su=await window.api.getStreamUrl(u);showProg(60);AP=new Audio(su);AP.volume=_vl.value/100;setupEv();
    AP.play().then(()=>{setStatus("Playing: "+it.title);showProg(100);}).catch(()=>{setStatus("Auto-play blocked, opening in browser...");showProg(0);window.api.openExternal(u);});
  }catch(e){setStatus("Error: "+e.message+" - Opening in browser...");showProg(0);window.api.openExternal(u);}
  finally{if(pb){pb.disabled=false;pb.textContent="\u25B6 Play";}}
}

async function playLocal(i){
  const it=R[i];if(!it||!it._fp)return;selRow(i);
  const ex=await window.api.checkFileExists(it._fp);
  if(!ex){it._dl=false;it._fp=null;setStatus("File not found");render();return;}
  if(AP){AP.pause();AP=null;}updUI(it,true);setStatus("Playing local: "+it.title);showProg(100);
  const fu="file:///"+it._fp.replace(/\\/g,"/");AP=new Audio(fu);AP.volume=_vl.value/100;setupEv();
  AP.play().then(()=>setStatus("Playing local: "+it.title)).catch(e=>{setStatus("Error: "+e.message);showProg(0);});
}

async function dlItem(i,fmt){
  const it=R[i];if(!it||it._dl)return;selRow(i);const u=getUrl(it);if(!u){setStatus("No URL available.");return;}
  const b=document.querySelector('tr[data-index="'+i+'"] .btn-'+fmt),rw=document.querySelector('tr[data-index="'+i+'"]');
  if(b){b.disabled=true;b.classList.add("downloading");b.textContent="...";}
  if(rw)rw.classList.add("downloading");
  const ext=fmt==="mp3"?"mp3":"mp4",fn=sanitize(it.title)+"."+ext;
  await window.api.notify("Download started",it.title+" ("+fmt.toUpperCase()+")");setStatus("Downloading: "+it.title+" ("+fmt.toUpperCase()+")...");showProg(10);
  try{const du=await window.api.getDownloadUrl(u,fmt);showProg(20);const sp=await window.api.downloadFile(du,fn);
    await window.api.addHistory({title:it.title,format:fmt.toUpperCase(),filePath:sp,url:u});it._dl=true;it._fp=sp;it._fm=fmt.toUpperCase();render();
    const nr=document.querySelector('tr[data-index="'+i+'"]');if(nr)nr.classList.add("dl-done");
    await window.api.notify("Download complete",it.title+" saved as "+fmt.toUpperCase());setStatus("Download complete: "+sp);showProg(100);
  }catch(e){setStatus("Download error: "+e.message);showProg(0);}
  finally{if(b){b.disabled=false;b.classList.remove("downloading");b.textContent=fmt.toUpperCase();}}
}

async function loadDl(){
  const l=$("downloadsList"),e=$("downloadsEmpty"),c=$("downloadsCount");
  let h=[];try{h=await window.api.getHistory();}catch(e){}
  c.textContent=h.length+" download"+(h.length!==1?"s":"");
  if(!h.length){l.innerHTML="";l.appendChild(e);e.style.display="flex";return;}
  e.style.display="none";l.innerHTML="";
  h.forEach(it=>{
    const d=_.createElement("div");d.className="download-item";
    const f=(it.format||"MP4").toLowerCase(),ds=it.date?new Date(it.date).toLocaleDateString()+" "+new Date(it.date).toLocaleTimeString():"",fn=it.filePath?it.filePath.split(/[\\/]/).pop():"";
    d.innerHTML='<div class="dl-icon '+f+'">'+f.toUpperCase()+'</div><div class="dl-info"><div class="dl-title">'+esc(it.title||"Unknown")+'</div><div class="dl-meta"><span>'+esc(fn)+'</span><span>'+esc(ds)+'</span></div></div><div class="dl-actions"><button class="dl-btn open">Open</button><button class="dl-btn folder">Folder</button><button class="dl-btn delete">X</button></div>';
    d.querySelector(".open").onclick=()=>{if(it.filePath)window.api.openFile(it.filePath);};
    d.querySelector(".folder").onclick=()=>{if(it.filePath)window.api.showInFolder(it.filePath);};
    d.querySelector(".delete").onclick=async()=>{await window.api.removeHistory(it.id);loadDl();};
    l.appendChild(d);
  });
}
$("clearHistoryBtn").onclick=async()=>{await window.api.clearHistory();loadDl();setStatus("Download history cleared.");};

function setStatus(m){_st.textContent=m;}
function showProg(p){_pc.classList.toggle("active",p>0&&p<100);_pg.style.width=p+"%";}
function esc(s){const d=_.createElement("div");d.textContent=s;return d.innerHTML;}
function sanitize(n){return n.replace(/[<>:"/\\|?*]/g,"_").substring(0,100);}

window.api.onDownloadProgress(p=>showProg(50+p/2));
window.api.onAppUpdated(msg=>{showStatusPanel({status:true,creator:"System",note:"App updated automatically: "+msg});});
document.onmousemove=e=>{document.querySelectorAll(".action-btn").forEach(b=>{const r=b.getBoundingClientRect();b.style.setProperty("--x",((e.clientX-r.left)/r.width*100)+"%");b.style.setProperty("--y",((e.clientY-r.top)/r.height*100)+"%");});};

/* ── Setup Flow ── */
async function initApp(){
  const has=await window.api.hasApiKey();
  if(!has){
    _sm.style.display="flex";
    _ml.onclick=async()=>{await window.api.openExternal("https://apiyosoyyo-ofc.onrender.com");};
    _ms.onclick=async()=>{
      const k=_aki.value.trim();if(!k){_me.textContent="Please enter an API key";return;}
      _ms.disabled=true;_ms.textContent="VALIDATING...";_me.textContent="";_aki.disabled=true;
      try{
        const res=await window.api.validateKey(k);
        if(res.valid){
          await window.api.setApiKey(k);
          _sm.style.display="none";
          $("appMain").style.display="flex";
          showStatusPanel(res.data);
        }else{
          _me.textContent="Invalid API key. Check it and try again.";
        }
      }catch(e){
        _me.textContent="Connection error. Try again.";
      }finally{
        _ms.disabled=false;_ms.textContent="ACTIVATE";_aki.disabled=false;
      }
    };
    _aki.onkeydown=e=>{if(e.key==="Enter")_ms.click();};
  }else{
    _sm.style.display="none";
    $("appMain").style.display="flex";
    const sd=await window.api.getStatus();
    if(sd)showStatusPanel(sd);
  }
}

function showStatusPanel(data){
  if(!data)return;
  _spb.innerHTML="";
    const isOnline=data.status===true||data.status==="true";
    const fields=[
      ["Status",isOnline?"Online":"Offline",isOnline?"green":"pink"],
    ["Creator",data.creator||"N/A",""],
    ["API Version",data.version||"N/A",""],
    ["Uptime",data.uptime||"N/A",""],
    ["Requests",data.requests||data.totalRequests||"N/A",""],
  ];
  if(data.message)fields.push(["Message",data.message,""]);
  if(data.note)fields.push(["Note",data.note,""]);
  fields.forEach(([l,v,c])=>{
    const row=_.createElement("div");row.className="sp-row";
    row.innerHTML='<span class="sp-label">'+l+'</span><span class="sp-val '+c+'">'+v+'</span>';
    _spb.appendChild(row);
  });
  _sp.style.display="block";_sbf.style.animation="none";void _sbf.offsetWidth;_sbf.style.animation="rgbSnake 2s linear infinite, barCountdown 5s linear forwards";
  setTimeout(()=>{_sp.classList.add("hiding");setTimeout(()=>{_sp.style.display="none";_sp.classList.remove("hiding");},400);},5000);
}

initApp();
