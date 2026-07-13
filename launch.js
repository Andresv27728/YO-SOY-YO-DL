const{spawn}=require("child_process");
const path=require("path");
const ep=path.join(__dirname,"node_modules",".bin","electron.cmd");
const app=path.join(__dirname,"main.js");
const p=spawn(ep,[app],{detached:true,stdio:"ignore",windowsHide:true});
p.unref();
