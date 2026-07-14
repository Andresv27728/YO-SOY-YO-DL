const{app:app, BrowserWindow:BW, ipcMain:ipc, shell:shell, Notification:Notif, Tray:Tray, Menu:Menu}=require("electron");
const path=require("path"), https=require("https"), http=require("http"), fs=require("fs"),{exec}=require("child_process");

const _C={k:"apiKey",v:"1.0.0"};
const _P=path.join(app.getPath("userData"),"ytconf.dat");
const _H=path.join(app.getPath("userData"),"dlhist.dat");
const _D=path.join(app.getPath("desktop"),"Descargas");

let _K="",_H2=[],_W=null,_T=null;
const _E="\x61\x70\x69\x79\x6f\x73\x6f\x79\x79\x6f\x2d\x6f\x66\x63\x2e\x6f\x6e\x72\x65\x6e\x64\x65\x72\x2e\x63\x6f\x6d";
const _B="\x68\x74\x74\x70\x73\x3a\x2f\x2f"+_E+"\x2f\x61\x70\x69\x2f";

function _L(){try{if(fs.existsSync(_P)){const d=JSON.parse(fs.readFileSync(_P,"utf8"));if(d&&d.k)_K=d.k;}}catch(e){}}
function _S(){try{fs.writeFileSync(_P,JSON.stringify({k:_K,v:_C.v,t:Date.now(),setupComplete:true}),"utf8");}catch(e){}}
function _LH(){try{_H2=fs.existsSync(_H)?JSON.parse(fs.readFileSync(_H,"utf8")):[]}catch(e){_H2=[];}}
function _SH(){try{fs.writeFileSync(_H,JSON.stringify(_H2,null,2),"utf8");}catch(e){}}

function _G(url,t=30000,retries=2){return new Promise((ok,er)=>{
  const m=url.startsWith("https")?https:http;
  const attempt=(n)=>{
    const r=m.get(url,{timeout:t},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){
        let loc=res.headers.location;if(loc.startsWith("/"))loc="https://"+_E+loc;
        return _G(loc,t,0).then(ok,er);
      }
      let d="";res.on("data",c=>d+=c);
      res.on("end",()=>ok({status:res.statusCode,headers:res.headers,body:d}));
    });
    r.on("error",e=>{
      if(n<retries){
        const wait=(n+1)*3000;
        if(_W&&!_W.isDestroyed())_W.webContents.send("api-status",{msg:"Server waking up, retrying in "+(wait/1000)+"s...",retry:true});
        setTimeout(()=>attempt(n+1),wait);
      }else er(e);
    });
    r.on("timeout",()=>{r.destroy();
      if(n<retries){
        const wait=(n+1)*3000;
        if(_W&&!_W.isDestroyed())_W.webContents.send("api-status",{msg:"Timeout, retrying in "+(wait/1000)+"s...",retry:true});
        setTimeout(()=>attempt(n+1),wait);
      }else er(new Error("TIMEOUT"));
    });
  };
  attempt(0);
});}

function _CW(){_W=new BW({width:960,height:750,minWidth:700,minHeight:500,backgroundColor:"#0f0f23",title:"YO SOY YO DL - by YO SOY YO",webPreferences:{preload:path.join(__dirname,"preload.js"),contextIsolation:true,nodeIntegration:false}});_W.loadFile("index.html");
  _W.on("close",e=>{if(!_Q){e.preventDefault();_W.hide();}});
}

let _Q=false;
function _TRAY(){
  const ip=path.join(__dirname,"icon.png");
  const icon=fs.existsSync(ip)?ip:undefined;
  _T=new Tray(icon||"");
  _T.setToolTip("YO SOY YO DL - by YO SOY YO");
  _T.setContextMenu(Menu.buildFromTemplate([
    {label:"YO SOY YO DL",enabled:false},
    {type:"separator"},
    {label:"Abrir",click:()=>{if(_W){_W.show();_W.focus();}}},
    {label:"Salir",click:()=>{_Q=true;if(_T)_T.destroy();app.quit();}}
  ]));
  _T.on("double-click",()=>{if(_W){_W.show();_W.focus();}});
}

function _UPD(){
  exec("git pull",{timeout:30000},(err,stdout)=>{
    if(err)return;
    const o=stdout||"";
    if(o.includes("Already up to date")||o.trim()==="")return;
    if(_W&&!_W.isDestroyed())_W.webContents.send("app-updated",o.trim());
  });
}

app.whenReady().then(()=>{_L();_LH();if(!fs.existsSync(_D))fs.mkdirSync(_D,{recursive:true});_CW();_TRAY();setTimeout(_UPD,5000);
  if(Notif.isSupported()){const n=new Notif({title:"YO SOY YO DL",subtitle:"App iniciada",body:"YO SOY YO DL esta activa y lista para usar.",silent:false});n.show();}
});
app.on("window-all-closed",()=>{});
app.on("before-quit",()=>{_Q=true;});

ipc.handle("hasApiKey",()=>!!_K);
ipc.handle("setApiKey",(_e,k)=>{_K=k;_S();return true;});

ipc.handle("validateKey",async(_e,k)=>{
  try{const r=await _G(_B+"status?apiKey="+encodeURIComponent(k),30000);let d;try{d=JSON.parse(r.body)}catch(e){d=null}
    if(d&&(d.status===true||d.status==="true"||d.api_name))return{valid:true,data:d};
    return{valid:false,msg:"Invalid API key"};
  }catch(e){
    if(e.message==="TIMEOUT")return{valid:false,msg:"Server is waking up (Render.com), try again in 30 seconds"};
    if(e.code==="ENOTFOUND")return{valid:false,msg:"No internet connection or server unreachable"};
    return{valid:false,msg:"Connection error: "+e.message};
  }
});

ipc.handle("getStatus",async()=>{
  if(!_K)return null;
  try{const r=await _G(_B+"status?apiKey="+encodeURIComponent(_K),30000);let d;try{d=JSON.parse(r.body)}catch(e){d=null}return d;}
  catch(e){return null;}
});

ipc.handle("search",async(_e,q)=>{
  let r;try{r=await _G(_B+"ytsearch?q="+encodeURIComponent(q)+"&apiKey="+_K,30000);}
  catch(e){
    if(e.message==="TIMEOUT")throw new Error("Server is waking up, try again in 30 seconds");
    if(e.code==="ENOTFOUND")throw new Error("No internet connection");
    throw new Error("Connection error: "+e.message);
  }
  let d;try{d=JSON.parse(r.body)}catch(e){d=[]}
  let items=Array.isArray(d)?d:d.results||d.items||[];
  if(!items.length&&typeof d==="object"){for(const v of Object.values(d)){if(Array.isArray(v)&&v.length){items=v;break;}}}
  return items.slice(0,50).map(it=>({title:it.title||"Unknown",duration:it.duration||"N/A",channel:it.channel||it.channelName||it.uploader||it.author||"N/A",url:it.videoUrl||it.url||it.link||"",thumbnail:it.thumbnailUrl||it.thumbnail||it.thumb||"",id:it.id||""}));
});

ipc.handle("getStreamUrl",async(_e,vu)=>{
  let r;try{r=await _G(_B+"youtube?q="+encodeURIComponent(vu)+"&apiKey="+_K,60000);}
  catch(e){
    if(e.message==="TIMEOUT")throw new Error("Server is waking up, try again in 30 seconds");
    if(e.code==="ENOTFOUND")throw new Error("No internet connection");
    throw new Error("Connection error: "+e.message);
  }
  let d;try{d=JSON.parse(r.body)}catch(e){d=null}
  if(!d)throw new Error("Invalid API response");
  let au=null;const res=d.result||d.results||d;const its=Array.isArray(res)?res:[res];
  for(const it of its){if(!it||typeof it!=="object")continue;
    if(it.url&&typeof it.url==="string"&&it.url.startsWith("http")){au=it.url;break;}
    if(it.link&&typeof it.link==="string"&&it.link.startsWith("http")){au=it.link;break;}
    if(it.download&&typeof it.download==="object"){if(it.download.mp3){au=it.download.mp3;break;}if(it.download.mp4){au=it.download.mp4;break;}}
    if(it.downloads&&typeof it.downloads==="object"){if(it.downloads.mp3&&it.downloads.mp3.url){au=it.downloads.mp3.url;break;}if(it.downloads.mixed&&it.downloads.mixed.mp3){au=it.downloads.mixed.mp3;break;}}
  }
  if(!au){const raw=JSON.stringify(d);const m=raw.match(/"(https?:\/\/[^"]+\.(mp3|mp4|webm|m4a)[^"]*)"/);if(m)au=m[1];}
  if(!au)throw new Error("No stream URL found");return au;
});

ipc.handle("getDownloadUrl",async(_e,vu,fmt)=>{
  try{const r=await _G(_B+"youtube/v2?url="+encodeURIComponent(vu)+"&format="+fmt+"&apiKey="+_K,15000);let d;try{d=JSON.parse(r.body)}catch(e){d=null}
    if(d){if(Array.isArray(d)){for(const x of d){if(x.url)return x.url;}}else if(d.url)return d.url;else if(d.link)return d.link;else if(d.download&&typeof d.download==="string")return d.download;}
  }catch(e){}
  let r1;try{r1=await _G(_B+"youtube?q="+encodeURIComponent(vu)+"&apiKey="+_K,60000);}
  catch(e){
    if(e.message==="TIMEOUT")throw new Error("Server is waking up, try again in 30 seconds");
    if(e.code==="ENOTFOUND")throw new Error("No internet connection");
    throw new Error("Connection error: "+e.message);
  }
  let d1;try{d1=JSON.parse(r1.body)}catch(e){d1=null}
  if(!d1)throw new Error("No download URL found");
  const res=d1.result||d1.results||d1;const its=Array.isArray(res)?res:[res];
  for(const it of its){if(!it||typeof it!=="object")continue;
    if(it.download&&typeof it.download==="object"){if(fmt==="mp3"&&it.download.mp3)return it.download.mp3;if(fmt==="mp4"&&it.download.mp4)return it.download.mp4;if(it.download.mp3)return it.download.mp3;if(it.download.mp4)return it.download.mp4;}
    if(it.downloads&&typeof it.downloads==="object"){if(it.downloads[fmt]&&it.downloads[fmt].url)return it.downloads[fmt].url;if(it.downloads.mixed&&it.downloads.mixed[fmt])return it.downloads.mixed[fmt];}
  }
  throw new Error("No download URL found");
});

ipc.handle("downloadFile",async(_e,fu,fn)=>{
  const sp=path.join(_D,fn);let fp=sp;let c=1;
  while(fs.existsSync(fp)){const ext=path.extname(fn);const base=path.basename(fn,ext);fp=path.join(_D,base+" ("+c+")"+ext);c++;}
  return new Promise((ok,er)=>{
    const mod=fu.startsWith("https")?https:http;
    const dl=(u)=>{const req=mod.get(u,{timeout:300000},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location)return dl(res.headers.location);
      if(res.statusCode!==200&&res.statusCode!==206){er(new Error("HTTP "+res.statusCode));return;}
      const tot=parseInt(res.headers["content-length"]||"0",10);let dl2=0;
      const f=fs.createWriteStream(fp);
      res.on("data",ch=>{f.write(ch);dl2+=ch.length;if(tot>0&&_W&&!_W.isDestroyed())_W.webContents.send("download-progress",Math.round((dl2/tot)*100));});
      res.on("end",()=>{f.end();ok(fp);});
      res.on("error",err=>{f.end();fs.unlink(fp,()=>{});er(err);});
    });req.on("error",er);req.on("timeout",()=>{req.destroy();er(new Error("Download timeout"));});};
    dl(fu);
  });
});

ipc.handle("openExternal",async(_e,u)=>shell.openExternal(u));
ipc.handle("getHistory",()=>_H2);
ipc.handle("addHistory",(_e,it)=>{_H2.unshift({id:Date.now(),title:it.title,format:it.format,filePath:it.filePath,url:it.url,date:new Date().toISOString()});if(_H2.length>200)_H2=_H2.slice(0,200);_SH();return _H2;});
ipc.handle("removeHistory",(_e,id)=>{_H2=_H2.filter(d=>d.id!==id);_SH();return _H2;});
ipc.handle("clearHistory",()=>{_H2=[];_SH();return _H2;});
ipc.handle("openFile",async(_e,fp)=>{if(fs.existsSync(fp))shell.openPath(fp);});
ipc.handle("showInFolder",async(_e,fp)=>{if(fs.existsSync(fp))shell.showItemInFolder(fp);});
ipc.handle("isDownloaded",(_e,vu)=>{const f=_H2.find(d=>d.url===vu);if(f&&fs.existsSync(f.filePath))return f;return null;});
ipc.handle("checkFileExists",(_e,fp)=>fs.existsSync(fp));
ipc.handle("notify",(_e,t,b)=>{if(Notif.isSupported()){const n=new Notif({title:"YO SOY YO DL",subtitle:t,body:b,silent:false});n.show();}});

ipc.on("window-minimize",()=>{if(_W)_W.minimize();});
ipc.on("window-maximize",()=>{if(_W)_W.isMaximized()?_W.unmaximize():_W.maximize();});
ipc.on("window-close",()=>{if(_W)_W.hide();});
ipc.handle("quitApp",()=>{_Q=true;if(_T)_T.destroy();app.quit();});
