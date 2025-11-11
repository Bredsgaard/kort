// api/_util.js – v2 (alle felter som default-krav + demo m.m.)

const AK_KEYS = { users:'ak_users', settings:'ak_settings', cards:'ak_cards', session:'ak_session' };

const defaultSettings = {
  appTitle:"Bredsgaard – Arbejdskort",
  emailRecipient:"pb@bredsgaard.dk",
  workTypes:["Service","Olieskift","Kædeskift"],
  consumables:[{name:"Olie",unit:"L"},{name:"Kabler",unit:"stk"},{name:"Kobling",unit:"stk"}],
  // 🚨 Default: ALLE felter påkrævet (admin kan slå fra i "Krav før afsendelse")
  requiredFields:[
    "maskinNr","maskintimer","km","svejsningTimer","elektroder",
    "diesel","normalTimer","overtimer","beskrivelse"
  ],
  adminUsername:"Bonde"
};

function load(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):structuredClone(f);}catch(_){return structuredClone(f)}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v));}

async function sha256(s){
  const e=new TextEncoder();
  const b=await crypto.subtle.digest("SHA-256",e.encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

function getSession(){
  const s=load(AK_KEYS.session,null);
  if(!s) return null;
  const now=Date.now();
  if(now - s.lastActivity > 15*60*1000){
    localStorage.removeItem(AK_KEYS.session);
    return null;
  }
  return s;
}
function touchSession(){
  const s=getSession();
  if(!s) return;
  s.lastActivity=Date.now();
  save(AK_KEYS.session,s);
}
setInterval(touchSession,60*1000);

function ensureDefaults(){
  if(!load(AK_KEYS.settings,null)) save(AK_KEYS.settings, defaultSettings);
  if(!load(AK_KEYS.cards,null)) save(AK_KEYS.cards, []);
  if(!load(AK_KEYS.users,null)){
    sha256("1234").then(h=>{
      save(AK_KEYS.users,[{id:crypto.randomUUID(),name:"Test Bruger",username:"test",pinHash:h,active:true}]);
    });
  }
}

// Demo-session (bruges hvis du har en "Prøv demo" knap)
function startDemoSession(){
  const sess = {
    userId: 'demo-user',
    role: 'employee',
    username: 'demo',
    name: 'Demo Bruger',
    lastActivity: Date.now(),
    demo: true
  };
  save(AK_KEYS.session, sess);
  ensureDefaults();
  const cards = load(AK_KEYS.cards, []);
  const hasDemo = cards.some(c => c.userId === 'demo-user');
  if(!hasDemo){
    cards.unshift({
      id: crypto.randomUUID(),
      userId: 'demo-user',
      date: yyyymmdd(new Date()),
      maskinNr: "DEMO-123",
      maskintimer: "100",
      km: "12",
      svejsningTimer: "",
      elektroder: "",
      diesel: "",
      normalTimer: "7.5",
      overtimer: "0",
      arbejdetsArt: "Service",
      beskrivelse: "Dette er et demokort, som viser hvordan historikken ser ud.",
      consumables: [{name:"Olie",unit:"L",qty:1}],
      images: [],
      status: "sent",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    save(AK_KEYS.cards, cards);
  }
}

function logout(){
  localStorage.removeItem(AK_KEYS.session);
  location.href="/index.html";
}

function yyyymmdd(d){
  const z=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`;
}
function isWithinLastMonth(s){
  const d=new Date(s);
  const n=new Date();
  const f=new Date(n.getFullYear(), n.getMonth()-1, n.getDate());
  return d>=f && d<=n;
}
function setHeaderTitle(e){
  const s=load(AK_KEYS.settings, defaultSettings);
  e.textContent = s.appTitle || defaultSettings.appTitle;
}

