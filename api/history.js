// history.js – medarbejderens historik

function renderHistory(root){
  const sess = getSession();
  if(!sess || sess.role!=='employee'){ location.href = './index.html'; return; }

  const nav = document.createElement('div');
  nav.className = 'header header--brand';
  nav.innerHTML = `<h1 id="apptitle"></h1><div class="nav"><a class="button ghost" href="./index.html">Nyt arbejdskort</a><button id="logout" class="button ghost">Log ud</button></div>`;
  document.body.prepend(nav);
  setHeaderTitle(nav.querySelector('#apptitle'));
  nav.querySelector('#logout').onclick = logout;

  const container = document.createElement('div'); container.className='container';
  const filter = document.createElement('div'); filter.className='card';

  const today = yyyymmdd(new Date());
  let from = new Date(); from.setDate(from.getDate() - 30);
  filter.innerHTML = `
    <div class="grid">
      <div class="field third"><label>Fra</label><input id="from" class="input" type="date" value="${yyyymmdd(from)}"></div>
      <div class="field third"><label>Til</label><input id="to" class="input" type="date" value="${today}"></div>
      <div class="field third"><label>Status</label><select id="status"><option value="all">Alle</option><option value="sent">Sendt</option><option value="draft">Kladde</option></select></div>
    </div>`;

  const tableWrap=document.createElement('div'); tableWrap.className='card';
  const table=document.createElement('table'); table.className='table';
  table.innerHTML=`<thead><tr><th>Dato</th><th>Arbejdet art</th><th>Status</th></tr></thead><tbody></tbody>`;
  tableWrap.appendChild(table);

  function refresh(){
    const rows = listMyCards({ status: filter.querySelector('#status').value, from: filter.querySelector('#from').value, to: filter.querySelector('#to').value });
    const tbody = table.querySelector('tbody'); tbody.innerHTML='';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${r.arbejdetsArt||'-'}</td><td>${r.status==='sent' ? '<span class="badge sent">Sendt</span>' : '<span class="badge draft">Kladde</span>'}</td>`;
      tbody.appendChild(tr);
    });
  }
  filter.addEventListener('input', refresh);

  container.appendChild(filter); container.appendChild(tableWrap); document.body.appendChild(container);
  refresh();
}

