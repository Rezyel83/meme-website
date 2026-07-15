// Wörter hier rein/raus - Kleinschreibung, ein Wort pro Zeile
const BLACKLIST = [
  "nazi", "hitler", "nigger", "faggot", "retard", "rape",
  "sex", "porn", "nude", "naked", "boobs", "ass", "dick", "penis", "vagina",
  "kill", "murder", "suicide", "drug", "cocaine", "weed", "alcohol", "drunk",
  "gun", "shoot", "blood", "gore", "fuck", "shit", "bitch", "whore", "slut",
  // deutsch
  "sex", "porno", "nackt", "titten", "arsch", "schwanz", "muschi", "töten",
  "mord", "selbstmord", "droge", "koks", "kokain", "besoffen", "waffe",
  "scheiße", "hure", "fotze", "nutte",
];

const card = document.getElementById("card");
const status = document.getElementById("status");
const subredditSel = document.getElementById("subreddit");
const filterToggle = document.getElementById("filterToggle");
const favBtn = document.getElementById("favBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const viewer = document.getElementById("viewer");

let posts = [];
let index = 0;
let showingFavs = false;
let wheelLocked = false;

function getFavs() {
  return JSON.parse(localStorage.getItem("favs") || "[]");
}
function toggleFav(id) {
  const favs = getFavs();
  const i = favs.indexOf(id);
  i === -1 ? favs.push(id) : favs.splice(i, 1);
  localStorage.setItem("favs", JSON.stringify(favs));
}

// pure & testbar: entscheidet ob ein Meme gezeigt wird
function isCleanPost(post, filterOn) {
  if (post.nsfw || post.spoiler) return false;
  if (filterOn) {
    const title = post.title.toLowerCase();
    if (BLACKLIST.some(w => title.includes(w.toLowerCase()))) return false;
  }
  return true;
}

async function loadMemes() {
  status.textContent = "Lade Memes...";
  const sub = subredditSel.value;
  const res = await fetch(`https://meme-api.com/gimme/${sub}/50`);
  const data = await res.json();
  const filterOn = filterToggle.checked;
  posts = data.memes.map(m => ({ ...m, id: m.postLink })).filter(p => isCleanPost(p, filterOn));
  index = 0;
  render();
}

function currentList() {
  if (!showingFavs) return posts;
  const favs = getFavs();
  return posts.filter(p => favs.includes(p.id));
}

function render() {
  const list = currentList();
  if (list.length === 0) {
    card.innerHTML = "";
    status.textContent = showingFavs ? "Noch keine Favoriten." : "Keine Memes gefunden.";
    return;
  }
  status.textContent = "";
  index = ((index % list.length) + list.length) % list.length;
  const p = list[index];
  const favs = getFavs();
  const isFav = favs.includes(p.id);
  card.innerHTML = `
    <img src="${p.url}" alt="${p.title}">
    <div class="body">
      <div class="title">${p.title}</div>
      <div class="row">
        <span>⬆ ${p.ups}</span>
        <span>${index + 1} / ${list.length}</span>
        <button class="heart">${isFav ? "❤️" : "🤍"}</button>
      </div>
    </div>`;
  card.querySelector(".heart").addEventListener("click", () => {
    toggleFav(p.id);
    render();
  });
}

function move(delta) {
  if (currentList().length === 0) return;
  index += delta;
  render();
}

prevBtn.addEventListener("click", () => move(-1));
nextBtn.addEventListener("click", () => move(1));

window.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowDown" || e.key === "ArrowRight") move(1);
});

viewer.addEventListener("wheel", e => {
  e.preventDefault();
  if (wheelLocked) return;
  wheelLocked = true;
  move(e.deltaY > 0 ? 1 : -1);
  setTimeout(() => (wheelLocked = false), 250); // ponytail: fixer debounce statt echtem momentum-tracking, reicht für normales scrollen
}, { passive: false });

subredditSel.addEventListener("change", loadMemes);
filterToggle.addEventListener("change", loadMemes);
favBtn.addEventListener("click", () => {
  showingFavs = !showingFavs;
  favBtn.textContent = showingFavs ? "⬅️ Zurück" : "❤️ Favoriten";
  index = 0;
  render();
});

loadMemes();

// Selbst-Check der Filter-Logik (läuft einmal beim Laden, siehe Konsole)
(function selfCheck() {
  const clean = { url: "https://i.redd.it/a.jpg", title: "harmless meme", nsfw: false, spoiler: false };
  console.assert(isCleanPost(clean, true) === true, "clean post sollte durchgehen");
  console.assert(isCleanPost({ ...clean, nsfw: true }, true) === false, "nsfw sollte raus");
  console.assert(isCleanPost({ ...clean, spoiler: true }, true) === false, "spoiler sollte raus");
  console.assert(isCleanPost({ ...clean, title: "NAZI meme" }, true) === false, "blacklist wort sollte raus (filter an)");
  console.assert(isCleanPost({ ...clean, title: "NAZI meme" }, false) === true, "blacklist wort sollte durch (filter aus)");
})();