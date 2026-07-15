// Wörter hier rein/raus - Kleinschreibung, ein Wort pro Zeile
const BLACKLIST = [
  "nazi",
  "hitler",
  "nigger",
  "faggot",
  "retard",
  "rape",
  "sex",
  "porn",
  "nude",
  "naked",
  "boobs",
  "ass",
  "dick",
  "penis",
  "vagina",
  "kill",
  "murder",
  "suicide",
  "drug",
  "cocaine",
  "weed",
  "gun",
  "shoot",
  "blood",
  "gore",
  "bitch",
  "whore",
  "slut",
];

const grid = document.getElementById("grid");
const status = document.getElementById("status");
const subredditSel = document.getElementById("subreddit");
const filterToggle = document.getElementById("filterToggle");
const randomBtn = document.getElementById("randomBtn");
const favBtn = document.getElementById("favBtn");

let posts = [];
let showingFavs = false;

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
  posts = data.memes.map(m => ({ ...m, id: m.postLink }));
  render();
}

function render() {
  const filterOn = filterToggle.checked;
  const favs = getFavs();
  let list = posts.filter(p => isCleanPost(p, filterOn));
  if (showingFavs) list = list.filter(p => favs.includes(p.id));

  grid.innerHTML = "";
  if (list.length === 0) {
    status.textContent = showingFavs ? "Noch keine Favoriten." : "Keine Memes gefunden.";
    return;
  }
  status.textContent = "";

  for (const p of list) {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = p.id;
    const isFav = favs.includes(p.id);
    card.innerHTML = `
      <img src="${p.url}" alt="${p.title}" loading="lazy">
      <div class="body">
        <div class="title">${p.title}</div>
        <div class="row">
          <span>⬆ ${p.ups}</span>
          <button class="heart ${isFav ? "active" : ""}">${isFav ? "❤️" : "🤍"}</button>
        </div>
      </div>`;
    card.querySelector(".heart").addEventListener("click", () => {
      toggleFav(p.id);
      render();
    });
    grid.appendChild(card);
  }
}

function showRandom() {
  const filterOn = filterToggle.checked;
  const list = posts.filter(p => isCleanPost(p, filterOn));
  if (list.length === 0) return;
  const pick = list[Math.floor(Math.random() * list.length)];
  const el = grid.querySelector(`[data-id="${pick.id}"]`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight");
    setTimeout(() => el.classList.remove("highlight"), 1500);
  }
}

subredditSel.addEventListener("change", loadMemes);
filterToggle.addEventListener("change", render);
randomBtn.addEventListener("click", showRandom);
favBtn.addEventListener("click", () => {
  showingFavs = !showingFavs;
  favBtn.textContent = showingFavs ? "⬅️ Zurück" : "❤️ Favoriten";
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