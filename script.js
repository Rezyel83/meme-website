const subredditSelect = document.getElementById("subredditSelect");
const favToggleBtn = document.getElementById("favToggleBtn");
const memeContainer = document.getElementById("memeContainer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const counter = document.getElementById("counter");

let memeCache = [];
let currentIndex = 0;
let showingFavorites = false;
let isLoading = false;

// Favoriten aus dem LocalStorage holen
function getFavorites() {
    return JSON.parse(localStorage.getItem("meme_favs") || "[]");
}

// Favorit umschalten
function toggleFavorite(meme) {
    let favs = getFavorites();
    const index = favs.findIndex(m => m.url === meme.url);
    
    if (index === -1) {
        favs.push(meme);
    } else {
        favs.splice(index, 1);
    }
    
    localStorage.setItem("meme_favs", JSON.stringify(favs));
    renderMeme();
}

// Memes von der API laden
async function fetchMemes() {
    if (isLoading || showingFavorites) return;
    isLoading = true;

    try {
        const subreddit = subredditSelect.value;
        const response = await fetch(`https://meme-api.com/gimme/${subreddit}/50`);
        const data = await response.json();

        if (data.memes) {
            // Nur Bilder nehmen, die keine GIFs/Videos sind (falls gewünscht, hier simpel gehalten)
            const newMemes = data.memes.filter(m => !m.url.endsWith(".gif") && !m.nsfw);
            memeCache.push(...newMemes);
        }
    } catch (error) {
        console.error("Fehler beim Laden der Memes:", error);
    } finally {
        isLoading = false;
    }
}

// Aktuelle Liste bestimmen (entweder Cache oder Favoriten)
function getActiveList() {
    if (showingFavorites) {
        return getFavorites();
    }
    return memeCache;
}

// Memes auf dem Bildschirm anzeigen
function renderMeme() {
    const list = getActiveList();

    if (list.length === 0) {
        memeContainer.innerHTML = `<div class="loading-spinner">${showingFavorites ? "Keine Favoriten gespeichert." : "Lade Memes..."}</div>`;
        counter.textContent = "0 / 0";
        return;
    }

    // Index im Rahmen halten
    currentIndex = Math.max(0, Math.min(currentIndex, list.length - 1));
    const meme = list[currentIndex];
    
    const favs = getFavorites();
    const isFav = favs.some(f => f.url === meme.url);

    memeContainer.innerHTML = `
        <img src="${meme.url}" alt="${meme.title}">
        <div class="meme-info">
            <div class="meme-title">${meme.title}</div>
            <div class="meme-meta">
                <span>⬆️ ${meme.ups || 0}</span>
                <button class="like-btn" id="favBtn">${isFav ? "❤️" : "🤍"}</button>
            </div>
        </div>
    `;

    counter.textContent = `${currentIndex + 1} / ${list.length}`;

    // Event-Listener für den Herz-Button
    document.getElementById("favBtn").addEventListener("click", () => {
        toggleFavorite(meme);
    });

    // Wenn wir uns dem Ende des Caches nähern, im Hintergrund Nachschub holen
    if (!showingFavorites && memeCache.length - currentIndex < 10) {
        fetchMemes();
    }
}

// Navigation vor/zurück
function move(direction) {
    const list = getActiveList();
    if (list.length === 0) return;

    currentIndex += direction;

    if (currentIndex < 0) {
        currentIndex = 0;
    } else if (currentIndex >= list.length) {
        currentIndex = list.length - 1;
    }

    renderMeme();
}

// Event Listener für Buttons
prevBtn.addEventListener("click", () => move(-1));
nextBtn.addEventListener("click", () => move(1));

// Tastatur-Steuerung (Pfeiltasten)
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        move(-1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        move(1);
    }
});

// Mausrad-Steuerung
window.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
        move(1);
    } else {
        move(-1);
    }
}, { passive: true });

// Subreddit wechseln
subredditSelect.addEventListener("change", async () => {
    memeCache = [];
    currentIndex = 0;
    showingFavorites = false;
    favToggleBtn.textContent = "🤍 Favoriten";
    
    memeContainer.innerHTML = `<div class="loading-spinner">Lade...</div>`;
    await fetchMemes();
    renderMeme();
});

// Favoriten-Ansicht umschalten
favToggleBtn.addEventListener("click", () => {
    showingFavorites = !showingFavorites;
    currentIndex = 0;
    
    if (showingFavorites) {
        favToggleBtn.textContent = "⬅️ Zurück";
        subredditSelect.disabled = true;
    } else {
        favToggleBtn.textContent = "🤍 Favoriten";
        subredditSelect.disabled = false;
    }
    
    renderMeme();
});

// Initialer Start beim Laden der Seite
async function init() {
    await fetchMemes();
    renderMeme();
}

init();