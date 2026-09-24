const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const url = require("url");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    users: [], spaces: [
      {id:"sp1", ownerId:"demo-owner", title:"Private Driveway — Main Square", address:"McLeod Ganj, Himachal Pradesh", city:"Dharamshala", price:40, vehicle:"Car", covered:true, availableFrom:"09:00", availableTo:"21:00", verified:true, lat:32.2426, lng:76.3213, active:true},
      {id:"sp2", ownerId:"demo-owner", title:"Hotel Overflow Parking", address:"Temple Road, McLeod Ganj", city:"Dharamshala", price:60, vehicle:"Car", covered:true, availableFrom:"08:00", availableTo:"23:00", verified:true, lat:32.2431, lng:76.3218, active:true}
    ], bookings: []
  }, null, 2));
}

function readDB(){ return JSON.parse(fs.readFileSync(DATA_FILE,"utf8")); }
function writeDB(db){ fs.writeFileSync(DATA_FILE, JSON.stringify(db,null,2)); }
function id(prefix){ return prefix+"_"+crypto.randomBytes(5).toString("hex"); }
function send(res, status, data, type="application/json"){
  res.writeHead(status, {"Content-Type":type, "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type", "Access-Control-Allow-Methods":"GET,POST,OPTIONS"});
  res.end(type==="application/json" ? JSON.stringify(data) : data);
}
function body(req){
  return new Promise((resolve,reject)=>{
    let s=""; req.on("data",c=>s+=c); req.on("end",()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}}); req.on("error",reject);
  });
}
function serveStatic(req,res){
  let p = url.parse(req.url).pathname;
  if(p==="/") p="/index.html";
  const safe = path.normalize(p).replace(/^(\.\.[\/\\])+/, "");
  const file = path.join(PUBLIC_DIR, safe);
  if(!file.startsWith(PUBLIC_DIR)) return send(res,403,{error:"Forbidden"});
  fs.readFile(file,(err,data)=>{
    if(err) return send(res,404,{error:"Not found"});
    const ext=path.extname(file);
    const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json"};
    send(res,200,data,types[ext]||"application/octet-stream");
  });
}

async function route(req,res){
  if(req.method==="OPTIONS") return send(res,204,"");
  const parsed=url.parse(req.url,true), p=parsed.pathname;
  try{
    const db=readDB();

    if(req.method==="GET" && p==="/api/spaces"){
      let list=db.spaces.filter(s=>s.active!==false);
      const q=(parsed.query.q||"").toLowerCase();
      if(q) list=list.filter(s=>(s.title+" "+s.address+" "+s.city).toLowerCase().includes(q));
      return send(res,200,{spaces:list});
    }

    if(req.method==="POST" && p==="/api/owners"){
      const b=await body(req);
      if(!b.name||!b.phone) return send(res,400,{error:"Name and phone are required"});
      const user={id:id("usr"),role:"owner",name:b.name,phone:b.phone,createdAt:new Date().toISOString()};
      db.users.push(user); writeDB(db); return send(res,201,{user});
    }

    if(req.method==="POST" && p==="/api/spaces"){
      const b=await body(req);
      if(!b.ownerId||!b.title||!b.address||!b.price) return send(res,400,{error:"ownerId, title, address and price are required"});
      const space={id:id("sp"),ownerId:b.ownerId,title:b.title,address:b.address,city:b.city||"",price:Number(b.price),vehicle:b.vehicle||"Car",covered:!!b.covered,availableFrom:b.availableFrom||"09:00",availableTo:b.availableTo||"21:00",verified:false,active:true};
      db.spaces.push(space); writeDB(db); return send(res,201,{space});
    }

    if(req.method==="POST" && p==="/api/bookings"){
      const b=await body(req);
      const space=db.spaces.find(s=>s.id===b.spaceId && s.active!==false);
      if(!space) return send(res,404,{error:"Parking space not found"});
      const hours=Math.max(1,Number(b.hours||1));
      const total=hours*space.price;
      const booking={id:id("bk"),spaceId:space.id,driverName:b.driverName||"Guest",phone:b.phone||"",vehicleNumber:b.vehicleNumber||"",startTime:b.startTime||"19:00",hours,total,status:"CONFIRMED",createdAt:new Date().toISOString()};
      db.bookings.push(booking); writeDB(db);
      return send(res,201,{booking,space});
    }

    if(req.method==="GET" && p==="/api/bookings"){
      return send(res,200,{bookings:db.bookings.slice().reverse()});
    }

    if(req.method==="GET" && p==="/api/health"){
      return send(res,200,{ok:true,service:"ParkShare API",time:new Date().toISOString()});
    }

    return serveStatic(req,res);
  }catch(e){ console.error(e); return send(res,500,{error:"Server error"}); }
}
http.createServer(route).listen(PORT,()=>console.log(`ParkShare running at http://localhost:${PORT}`));
