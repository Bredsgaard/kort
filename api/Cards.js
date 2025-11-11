// api/cards.js – v2

function getSettings(){ return load(AK_KEYS.settings, defaultSettings); }
function getCards(){ return load(AK_KEYS.cards, []); }
function putCards(list){ save(AK_KEYS.cards, list); }

// Opret et tomt arbejdskort
function blankCard(){
  return {
    id: crypto.randomUUID(),
    userId: getSession()?.userId || null,
    date: yyyymmdd(new Date()),
    maskinNr: "",
    maskintimer: "",
    km: "",
    svejsningTimer: "",
    elektroder: "",
    diesel: "",
    normalTimer: "",
    overtimer: "",
    arbejdetsArt: "",
    beskrivelse: "",
    consumables: [],
    images: [],
    status: "draft", // draft | sent
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

// Tjek om alle krævede felter er udfyldt
function requiredOk(card){
  const s = getSettings();
  if(!card.arbejdetsArt) return false;
  const req = new Set(s.requiredFields || []);
  for(const key of req){
    if((card[key] === undefined) || (String(card[key]).trim() === "")) return false;
  }
  return true;
}

// Gem eller opdater kort i LocalStorage
function upsertCard(card){
  const cards = getCards();
  const i = cards.findIndex(c => c.id === card.id);
  if(i >= 0) cards[i] = card;
  else cards.unshift(card);
  putCards(cards);
}

// Liste medarbejderens kort (filtreret)
function listMyCards(filter){
  const uid = getSession()?.userId;
  let cards = getCards().filter(c => c.userId === uid);
  cards = cards.filter(c => isWithinLastMonth(c.date));
  if(filter?.status && filter.status !== "all")
    cards = cards.filter(c => c.status === filter.status);
  if(filter?.from) cards = cards.filter(c => c.date >= filter.from);
  if(filter?.to) cards = cards.filter(c => c.date <= filter.to);
  return cards;
}

// Forbrugsliste (olie, kabler osv.)
function pickConsumablesUI(root, card){
  const list = getSettings().consumables || [];
  const wrap = document.createElement("div");
  list.forEach(item=>{
    const row = document.createElement("div");
    row.className = "grid";
    row.style.marginBottom = "8px";
    row.innerHTML = `
      <div class="field third">
        <label>${item.name} (${item.unit})</label>
        <input class="input qty" type="number" min="0" step="1" placeholder="Fx 1">
      </div>`;
    const input = row.querySelector(".qty");
    const ex = (card.consumables||[]).find(c => c.name === item.name);
    if(ex) input.value = ex.qty;
    input.addEventListener("input", ()=>{
      const qty = input.value ? Number(input.value) : "";
      const idx = card.consumables.findIndex(c => c.name === item.name);
      if(qty === "" || isNaN(qty) || qty === 0){
        if(idx >= 0) card.consumables.splice(idx,1);
      } else {
        if(idx >= 0) card.consumables[idx].qty = qty;
        else card.consumables.push({name:item.name, unit:item.unit, qty});
      }
    });
    wrap.appendChild(row);
  });
  root.appendChild(wrap);
}

// Billeduploader
function imageUploader(root, card){
  const box = document.createElement("div");
  box.className = "uploader";
  box.innerHTML = `
    <p><span class="button">+ Tilføj billede(r)</span><br>
    <small class="hint">Valgfrit. Antal: <b class="count">0</b></small></p>
    <input type="file" accept="image/*" multiple>`;
  const input = box.querySelector("input");
  const btn = box.querySelector(".button");
  const count = box.querySelector(".count");
  const strip = document.createElement("div");
  strip.className = "thumbstrip";

  btn.onclick = ()=> input.click();
  input.onchange = async ()=>{
    for(const f of input.files){
      await new Promise(res=>{
        const r = new FileReader();
        r.onload = ()=>{ card.images.push(r.result); res(); };
        r.readAsDataURL(f);
      });
    }
    count.textContent = String(card.images.length);
    render();
  };

  function render(){
    strip.innerHTML = "";
    card.images.forEach((src, i)=>{
      const img = new Image();
      img.src = src;
      img.className = "thumb";
      img.title = "Klik for at fjerne";
      img.style.cursor = "pointer";
      img.onclick = ()=>{
        card.images.splice(i,1);
        count.textContent = String(card.images.length);
        render();
      };
      strip.appendChild(img);
    });
  }
  render();
  root.appendChild(box);
  root.appendChild(strip);
}

// Hovedformular til "Nyt arbejdskort"
function buildCardForm(root){
  const s = getSettings();
  const req = new Set(s.requiredFields || []);
  let card = blankCard();

  const section = document.createElement("div");
  section.className = "card";
  section.innerHTML = `
    <div class="grid">
      <div class="field third"><label>Dato</label><input id="date" class="input" type="date" value="${card.date}"></div>
      <div class="field third"><label>Maskin nr</label><input id="maskinNr" class="input" type="text" placeholder="Fx serienr./intern nr"></div>
      <div class="field third"><label>Maskintimer</label><input id="maskintimer" class="input" type="number" min="0" step="1" placeholder="Fx 100"></div>
      <div class="field third"><label>Kørte km</label><input id="km" class="input" type="number" min="0" step="1" placeholder="Fx 25"></div>
      <div class="field third"><label>Svejsning (timer)</label><input id="svejsningTimer" class="input" type="number" min="0" step="0.5" placeholder="Fx 1.5"></div>
      <div class="field third"><label>Elektroder (stk)</label><input id="elektroder" class="input" type="number" min="0" step="1" placeholder="Fx 10"></div>
      <div class="field third"><label>Diesel (liter)</label><input id="diesel" class="input" type="number" min="0" step="1" placeholder="Fx 5"></div>
      <div class="field third"><label>Normal timer</label><input id="normalTimer" class="input" type="number" min="0" step="0.25" placeholder="Fx 7.5"></div>
      <div class="field third"><label>Overtimer</label><input id="overtimer" class="input" type="number" min="0" step="0.25" placeholder="Fx 2"></div>
      <div class="field full"><label>Arbejdet art <span class="req">★</span></label>
        <select id="arbejdetArt"><option value="">Vælg...</option>${(s.workTypes||[]).map(w=>`<option>${w}</option>`).join("")}</select>
      </div>
      <div class="field full"><label>Fejlbeskrivelse / Udført arbejde</label>
        <textarea id="beskrivelse" rows="4" placeholder="Skriv beskrivelse..."></textarea></div>
    </div>`;

  // Forbrug og billeder
  const cons = document.createElement("div");
  cons.className = "card";
  cons.innerHTML = `<h3>Forbrug</h3>`;
  pickConsumablesUI(cons, card);

  const imgs = document.createElement("div");
  imgs.className = "card";
  imgs.innerHTML = `<h3>Billeder</h3>`;
  imageUploader(imgs, card);

  // Knapper
  const actions = document.createElement("div");
  actions.className = "card";
  actions.innerHTML = `
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button id="saveDraft" class="button">Gem kladde</button>
      <button id="saveSend" class="button primary">Gem &amp; send</button>
    </div>
    <small class="hint">"Gem & send" kræver Arbejdet art og alle admin-krævede felter (★).</small>`;

  // Bind inputfelter
  function bind(id,key){
    const el = section.querySelector("#"+id);
    el.oninput = ()=>{ card[key] = el.value; card.updatedAt = Date.now(); };
  }
  [
    ["date","date"],["maskinNr","maskinNr"],["maskintimer","maskintimer"],["km","km"],
    ["svejsningTimer","svejsningTimer"],["elektroder","elektroder"],["diesel","diesel"],
    ["normalTimer","normalTimer"],["overtimer","overtimer"],["arbejdetArt","arbejdetsArt"],
    ["beskrivelse","beskrivelse"]
  ].forEach(([a,b])=>bind(a,b));

  // Vis ★ ved kravfelter
  req.forEach(key=>{
    const el = section.querySelector("#"+key);
    if(el){
      const label = el.previousElementSibling;
      if(label) label.innerHTML = label.textContent + ' <span class="req">★</span>';
    }
  });

  actions.querySelector("#saveDraft").onclick = ()=>{
    card.status = "draft";
    upsertCard(card);
    alert("Kladde gemt.");
    location.reload();
  };

  actions.querySelector("#saveSend").onclick = ()=>{
    if(!requiredOk(card))
      return alert("Udfyld Arbejdet art og alle påkrævede felter (★).");
    card.status = "sent";
    upsertCard(card);
    alert("Markeret som sendt.");
    location.reload();
  };

  root.appendChild(section);
  root.appendChild(cons);
  root.appendChild(imgs);
  root.appendChild(actions);
}
