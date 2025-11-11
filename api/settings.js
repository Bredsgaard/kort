// api/settings.js – v2

function getUsers(){ return load(AK_KEYS.users, []); }
function putUsers(list){ save(AK_KEYS.users, list); }
function setSettings(s){ save(AK_KEYS.settings, s); }

function buildAdminUI(root){
  const s = load(AK_KEYS.settings, defaultSettings);

  // Header
  const nav=document.createElement('div');
  nav.className='header';
  nav.innerHTML=`
    <h1 id="apptitle"></h1>
    <div class="nav">
      <a class="button" href="/index.html">Medarbejder</a>
      <button id="logout" class="button ghost">Log ud</button>
    </div>`;
  document.body.prepend(nav);
  setHeaderTitle(nav.querySelector('#apptitle'));
  nav.querySelector('#logout').onclick = logout;

  // Hovedcontainer
  const container=document.createElement('div');
  container.className='container';

  const tabs=document.createElement('div');
  tabs.className='card';
  tabs.innerHTML=`
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="button" data-tab="users">Brugere</button>
      <button class="button" data-tab="requirements">Krav før afsendelse</button>
      <button class="button" data-tab="worktypes">Arbejdstyper</button>
      <button class="button" data-tab="consumables">Forbrugsliste</button>
      <button class="button" data-tab="email">E-mail & Branding</button>
      <button class="button" data-tab="importexport">Import/Export</button>
    </div>`;

  const view=document.createElement('div');
  view.className='card';
  container.appendChild(tabs);
  container.appendChild(view);
  document.body.appendChild(container);

  // Faneblade
  tabs.addEventListener('click', e=>{
    const b=e.target.closest('button[data-tab]');
    if(!b) return;
    showTab(b.dataset.tab);
  });

  function showTab(tab){
    if(tab==='users') renderUsers();
    if(tab==='requirements') renderReq();
    if(tab==='worktypes') renderWorkTypes();
    if(tab==='consumables') renderConsumables();
    if(tab==='email') renderEmail();
    if(tab==='importexport') renderImportExport();
  }
  showTab('users');

  // --- Brugere ---
  function renderUsers(){
    view.innerHTML='<h3>Brugere</h3>';
    const users=getUsers();
    const table=document.createElement('table');
    table.className='table';
    table.innerHTML=`
      <thead><tr><th>Navn</th><th>Brugernavn</th><th>Aktiv</th><th></th></tr></thead>
      <tbody></tbody>`;
    const tbody=table.querySelector('tbody');

    users.forEach(u=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${u.name}</td>
        <td>${u.username}</td>
        <td>${u.active!==false?'Ja':'Nej'}</td>
        <td style="text-align:right">
          <button class="button" data-edit="${u.id}">Redigér</button>
          <button class="button warn" data-del="${u.id}">Slet</button>
        </td>`;
      tbody.appendChild(tr);
    });

    const addWrap=document.createElement('div');
    addWrap.style.marginTop='12px';
    addWrap.innerHTML=`<button id="addUser" class="button primary">+ Opret bruger</button>`;
    view.replaceChildren(document.createElement('h3'), table, addWrap);

    view.onclick=async e=>{
      if(e.target.dataset.edit){
        const id=e.target.dataset.edit;
        const u=users.find(x=>x.id===id);
        const name=prompt('Navn',u.name);
        if(name===null) return;
        const username=prompt('Brugernavn',u.username);
        if(username===null) return;
        const pin=prompt('Ny PIN (4 cifre) – tom = uændret','');
        if(pin && pin.length!==4) return alert('PIN skal være 4 cifre.');
        const active=confirm('Aktiv? OK = Ja');
        u.name=name; u.username=username; u.active=active;
        if(pin){ u.pinHash=await sha256(pin); }
        putUsers(users);
        renderUsers();
      }

      if(e.target.dataset.del){
        const id=e.target.dataset.del;
        if(confirm('Slet bruger?')){
          const i=users.findIndex(x=>x.id===id);
          users.splice(i,1);
          putUsers(users);
          renderUsers();
        }
      }

      if(e.target.id==='addUser'){
        const name=prompt('Navn');
        if(!name) return;
        const username=prompt('Brugernavn');
        if(!username) return;
        const pin=prompt('PIN (4 cifre)');
        if(!pin||pin.length!=4) return alert('PIN skal være 4 cifre.');
        users.push({id:crypto.randomUUID(),name,username,pinHash:await sha256(pin),active:true});
        putUsers(users);
        renderUsers();
      }
    };
  }

  // --- Krav før afsendelse ---
  function renderReq(){
    view.innerHTML='<h3>Krav før afsendelse</h3>';
    const fields=[
      ['maskinNr','Maskin nr'],
      ['maskintimer','Maskintimer'],
      ['km','Kørte km'],
      ['svejsningTimer','Svejsning (timer)'],
      ['elektroder','Elektroder (stk)'],
      ['diesel','Diesel (liter)'],
      ['normalTimer','Normal timer'],
      ['overtimer','Overtimer'],
      ['beskrivelse','Fejlbeskrivelse / Udført arbejde']
    ];
    const set=new Set(s.requiredFields||[]);
    const list=document.createElement('div');
    list.className='grid';
    fields.forEach(([k,l])=>{
      const div=document.createElement('div');
      div.className='field third';
      div.innerHTML=`<label><input type="checkbox" ${set.has(k)?'checked':''} data-key="${k}"> ★ ${l}</label>`;
      list.appendChild(div);
    });
    const note=document.createElement('p');
    note.innerHTML='<small class="hint">"Arbejdet art" er altid påkrævet.</small>';
    const saveBtn=document.createElement('button');
    saveBtn.className='button primary';
    saveBtn.textContent='Gem indstillinger';
    saveBtn.onclick=()=>{
      s.requiredFields=Array.from(list.querySelectorAll('input:checked')).map(i=>i.dataset.key);
      setSettings(s);
      alert('Gemt.');
    };
    view.replaceChildren(document.createElement('h3'), list, note, saveBtn);
  }

  // --- Arbejdstyper ---
  function renderWorkTypes(){
    view.innerHTML='<h3>Arbejdstyper</h3>';
    const ul=document.createElement('ul');
    (s.workTypes||[]).forEach((w,i)=>{
      const li=document.createElement('li');
      li.style.marginBottom='6px';
      li.innerHTML=`<input class="input" value="${w}">
        <button class="button warn" data-del="${i}">Slet</button>`;
      ul.appendChild(li);
    });
    const add=document.createElement('div');
    add.style.marginTop='8px';
    add.innerHTML=`<input id="newWork" class="input" placeholder="Ny arbejdstype">
      <button id="addWork" class="button">Tilføj</button>`;
    const save=document.createElement('button');
    save.className='button primary';
    save.textContent='Gem';
    save.onclick=()=>{
      s.workTypes=Array.from(ul.querySelectorAll('li input')).map(i=>i.value).filter(Boolean);
      setSettings(s);
      alert('Gemt.');
    };
    view.replaceChildren(document.createElement('h3'), ul, add, save);
    view.onclick=e=>{
      if(e.target.dataset.del){ ul.children[e.target.dataset.del].remove(); }
      if(e.target.id==='addWork'){
        const v=view.querySelector('#newWork').value.trim();
        if(v){
          const li=document.createElement('li');
          li.style.marginBottom='6px';
          li.innerHTML=`<input class="input" value="${v}">
            <button class="button warn" data-del="${ul.children.length}">Slet</button>`;
          ul.appendChild(li);
          view.querySelector('#newWork').value='';
        }
      }
    };
  }

  // --- Forbrugsliste ---
  function renderConsumables(){
    view.innerHTML='<h3>Forbrugsliste</h3>';
    const ul=document.createElement('ul');
    (s.consumables||[]).forEach((c,i)=>{
      const li=document.createElement('li');
      li.style.marginBottom='6px';
      li.innerHTML=`
        <input class="input" style="max-width:240px" value="${c.name}">
        <input class="input" style="max-width:120px" value="${c.unit}">
        <button class="button warn" data-del="${i}">Slet</button>`;
      ul.appendChild(li);
    });
    const add=document.createElement('div');
    add.style.marginTop='8px';
    add.innerHTML=`
      <input id="newName" class="input" placeholder="Navn" style="max-width:240px">
      <input id="newUnit" class="input" placeholder="Enhed" style="max-width:120px">
      <button id="addCon" class="button">Tilføj</button>`;
    const save=document.createElement('button');
    save.className='button primary';
    save.textContent='Gem';
    save.onclick=()=>{
      s.consumables=Array.from(ul.querySelectorAll('li')).map(li=>{
        const [n,u]=li.querySelectorAll('input');
        return {name:n.value,unit:u.value};
      }).filter(x=>x.name&&x.unit);
      setSettings(s);
      alert('Gemt.');
    };
    view.replaceChildren(document.createElement('h3'), ul, add, save);
    view.onclick=e=>{
      if(e.target.dataset.del){ ul.children[e.target.dataset.del].remove(); }
      if(e.target.id==='addCon'){
        const n=view.querySelector('#newName').value.trim();
        const u=view.querySelector('#newUnit').value.trim();
        if(n&&u){
          const li=document.createElement('li');
          li.style.marginBottom='6px';
          li.innerHTML=`
            <input class="input" style="max-width:240px" value="${n}">
            <input class="input" style="max-width:120px" value="${u}">
            <button class="button warn" data-del="${ul.children.length}">Slet</button>`;
          ul.appendChild(li);
          view.querySelector('#newName').value='';
          view.querySelector('#newUnit').value='';
        }
      }
    };
  }

  // --- E-mail & Branding ---
  function renderEmail(){
    view.innerHTML='<h3>E-mail & Branding</h3>';
    const wrap=document.createElement('div');
    wrap.className='grid';
    wrap.innerHTML=`
      <div class="field full"><label>App-titel/branding</label>
        <input id="title" class="input" value="${s.appTitle||''}" placeholder="App titel"></div>
      <div class="field full"><label>Standard modtager-email</label>
        <input id="email" class="input" type="email" value="${s.emailRecipient||''}" placeholder="fx pb@bredsgaard.dk"></div>
      <div class="field full"><label>Admin-brugernavn</label>
        <input id="adminu" class="input" value="${s.adminUsername||'Bonde'}" placeholder="fx Bonde"></div>
      <div class="field full"><small class="hint">Admin-kode er fastsat til 0705 i denne fase.</small></div>`;
    const saveBtn=document.createElement('button');
    saveBtn.className='button primary';
    saveBtn.textContent='Gem';
    saveBtn.onclick=()=>{
      s.appTitle=wrap.querySelector('#title').value;
      s.emailRecipient=wrap.querySelector('#email').value;
      s.adminUsername=wrap.querySelector('#adminu').value||'Bonde';
      setSettings(s);
      alert('Gemt.');
      setHeaderTitle(document.querySelector('#apptitle'));
    };
    view.replaceChildren(document.createElement('h3'), wrap, saveBtn);
  }

  // --- Import/Export ---
  function renderImportExport(){
    view.innerHTML='<h3>Import/Export</h3>';
    const exp=document.createElement('button');
    exp.className='button';
    exp.textContent='Export JSON';
    const imp=document.createElement('button');
    imp.className='button';
    imp.textContent='Import JSON';
    const input=document.createElement('input');
    input.type='file';
    input.accept='application/json';
    input.style.display='none';
    imp.onclick=()=>input.click();
    input.onchange=async()=>{
      const file=input.files[0];
      const text=await file.text();
      try{
        const data=JSON.parse(text);
        if(data.users) save(AK_KEYS.users,data.users);
        if(data.settings) save(AK_KEYS.settings,data.settings);
        alert('Import gennemført.');
      }catch(_){ alert('Kunne ikke importere JSON.'); }
    };
    exp.onclick=()=>{
      const data={
        users:load(AK_KEYS.users,[]),
        settings:load(AK_KEYS.settings,defaultSettings)
      };
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='arbejdskort-settings.json';
      a.click();
    };
    view.replaceChildren(document.createElement('h3'), exp, imp, input);
  }
}

