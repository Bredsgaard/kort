// api/login.js – v2
async function employeeLogin(username,pin){
  const users=load(AK_KEYS.users,[]);
  const hash=await sha256(pin);
  const u=users.find(x=>x.username.trim().toLowerCase()===username.trim().toLowerCase()&&x.pinHash===hash&&x.active!==false);
  if(!u)return null;
  const sess={userId:u.id,role:'employee',username:u.username,name:u.name,lastActivity:Date.now()};
  save(AK_KEYS.session,sess);return sess;
}
async function adminLogin(username,code){
  const s=load(AK_KEYS.settings,defaultSettings);
  if(username.trim().toLowerCase()===(s.adminUsername||"Bonde").toLowerCase()&&code==="0705"){
    const sess={userId:'admin',role:'admin',username,name:'Administrator',lastActivity:Date.now()};
    save(AK_KEYS.session,sess);return sess;
  }
  return null;
}

