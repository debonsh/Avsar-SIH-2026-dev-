const API = localStorage.API || "http://localhost:8000";
const $ = id => document.getElementById(id);
const outbox = JSON.parse(localStorage.outbox || "[]"); // ponytail: offline queue, syncs when online

function show(id) {
  for (const s of ["s-price", "s-lot", "s-ledger"]) $(s).hidden = s !== id;
  if (id === "s-price") loadPrices();
  if (id === "s-ledger") loadLedger();
}
async function get(p) { const r = await fetch(API + p); return r.json(); }

async function loadPrices() {
  try {
    const ps = await get("/prices");
    $("prices").innerHTML = ps.map(p =>
      `<div class="row"><span>${p.material} (${p.city})</span><b>₹${p.buy_price}/kg</b></div>`).join("") || "no data";
  } catch { $("prices").innerHTML = '<span class="off">offline — showing last saved prices</span>'; }
}
async function loadMats() {
  try { const ms = await get("/materials"); $("mat").innerHTML = ms.map(m => `<option>${m}</option>`).join(""); }
  catch { $("mat").innerHTML = ["PCB","CRT","LCD","Cables","Batteries","Motors/Magnets","Mixed Plastics","Metals"].map(m=>`<option>${m}</option>`).join(""); }
}
let lastFile = null;
$("photo").onchange = async e => {
  lastFile = e.target.files[0]; if (!lastFile) return;
  $("prev").src = URL.createObjectURL(lastFile); $("prev").hidden = false;
  $("est").innerHTML = "पहचान रहे हैं…";
  const fd = new FormData(); fd.append("photo", lastFile);
  try {
    const j = await (await fetch(API + "/classify", { method: "POST", body: fd })).json();
    const top = j.predictions[0];
    $("mat").value = top.label;
    $("est").innerHTML = `लगता है: <b>${top.label}</b> (${Math.round(top.conf*100)}%)` +
      (j.needs_confirm ? "<br>सही है? गलत हो तो ऊपर बदलें (please confirm)" : "");
  } catch { $("est").innerHTML = '<span class="off">offline — खुद category चुनें</span>'; }
};

async function saveLot() {
  const lot = { collector_id: 1, material: $("mat").value, weight_kg: +$("wt").value || 0 };
  try {
    const r = await fetch(API + "/lots", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(lot) });
    const j = await r.json();
    $("est").innerHTML = `अनुमान: <b>₹${j.estimate_inr}</b> (lot #${j.id})`;
  } catch { outbox.push(lot); localStorage.outbox = JSON.stringify(outbox);
    $("est").innerHTML = '<span class="off">offline — saved, will sync later</span>'; }
}
async function loadLedger() {
  try { const ls = await get("/ledger/1");
    $("ledger").innerHTML = ls.map(l =>
      `<div class="row"><span>#${l.lot_id} ${l.material} ${l.weight_kg}kg</span><b>₹${l.estimate_inr} · ${l.status}</b></div>`).join("") || "empty";
  } catch { $("ledger").innerHTML = '<span class="off">offline</span>'; }
}
async function sync() { // flush outbox when back online
  while (outbox.length && navigator.onLine) {
    const lot = outbox[0];
    try { await fetch(API + "/lots", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(lot) });
      outbox.shift(); localStorage.outbox = JSON.stringify(outbox);
    } catch { break; }
  }
}
addEventListener("online", () => { $("net").textContent = "online"; sync(); });
addEventListener("offline", () => $("net").textContent = "OFFLINE — काम जारी रहेगा");
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
loadPrices(); loadMats();
