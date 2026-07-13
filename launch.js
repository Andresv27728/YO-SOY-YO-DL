const{spawn}=require("child_process");
const path=require("path");
const ep=path.join(__dirname,"node_modules","electron","dist","electron.exe");
const app=path.join(__dirname,"main.js");
const p=spawn(ep,[app],{detached:true,stdio:"ignore",windowsHide:true,cwd:__dirname});
p.unref();
