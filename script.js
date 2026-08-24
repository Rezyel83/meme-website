// Liste von Subreddits, aus denen gemischt wird, damit es nie langweilig wird
const SUBREDDITS = ["ich_iel", "deutschememes", "memes", "dankmemes", "wholesomememes", "me_irl", "funny", "ProgrammerHumor"];

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

// Das Gedächtnis: Merkt sich ALLE jemals gesehenen Memes in dieser Session (gegen Wiederholungen)
let seenMemesTracker = new Set();

function getFavorites() {
    return JSON.parse(localStorage.getItem("meme_favs") || "[]");
}

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

// Memes laden und Duplikate rigoros aussortieren
async function fetchMemes() {
    if (isLoading || showingFavorites) return;
    isLoading = true;

    try {
        // Entweder das ausgewählte Subreddit oder zufällig aus allen mischen
        const chosenSub = subredditSelect.value;
        const response = await fetch(`https://meme-api.com/gimme/${chosenSub}/50`);
        const data = await response.json();

        if (data && data.memes) {
            let newUniqueMemes = 0;
            
            for (let m of data.memes) {
                // Prüfen ob Bild gültig, kein NSFW und vor allem NOCH NIE GESEHEN
                if (m.url && !m.nsfw && m.url.match(/\.(jpg|png|jpeg)$/i)) {
                    if (!seenMemesTracker.has(m.url)) {
                        seenMemesTracker.add(m.url);
                        memeCache.push(m);
                        newUniqueMemes++;
                    }
                }
            }
            console.log(`${newUniqueMemes} neue, bisher ungesehene Memes hinzugefügt.`);
        }
    } catch (error) {
        console.error("Fehler beim Laden:", error);
    } finally {
        isLoading = false;
    }
}

function getActiveList() {
    if (showingFavorites) return getFavorites();
    return memeCache;
}

function renderMeme() {
    const list = getActiveList();

    if (list.length === 0) {
        memeContainer.innerHTML = `<div class="loading-spinner">Keine neuen Memes da. Lade Nachschub...</div>`;
        counter.textContent = "0 / 0";
        return;
    }

    currentIndex = Math.max(0, Math.min(currentIndex, list.length - 1));
    const meme = list[currentIndex];
    
    const favs = getFavorites();
    const isFav = favs.some(f => f.url === meme.url);

    memeContainer.innerHTML = `
        <img src="${meme.url}" alt="${meme.title || 'Meme'}">
        <div class="meme-info">
            <div class="meme-title">${meme.title || 'Kein Titel'}</div>
            <div class="meme-meta">
                <span>⬆️ ${meme.ups || 0}</span>
                <button class="like-btn" id="favBtn">${isFav ? "❤️" : "🤍"}</button>
            </div>
        </div>
    `;

    counter.textContent = `${currentIndex + 1} / ${list.length}`;

    document.getElementById("favBtn").addEventListener("click", () => {
        toggleFavorite(meme);
    });

    // Wenn wir uns dem Ende nähern, automatisch frische Memes im Hintergrund holen
    if (!showingFavorites && memeCache.length - currentIndex < 10) {
        fetchMemes();
    }
}

function move(direction) {
    const list = getActiveList();
    if (list.length === 0) return;

    currentIndex += direction;

    // Wenn man am Ende der Liste ist und nach unten drückt, direkt nachladen falls möglich
    if (!showingFavorites && currentIndex >= list.length - 2) {
        fetchMemes();
    }

    currentIndex = Math.max(0, Math.min(currentIndex, list.length - 1));
    renderMeme();
}

prevBtn.addEventListener("click", () => move(-1));
nextBtn.addEventListener("click", () => move(1));

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(-1);
    if (e.key === "ArrowDown" || e.key === "ArrowRight") move(1);
});

window.addEventListener("wheel", (e) => {
    move(e.deltaY > 0 ? 1 : -1);
}, { passive: true });

subredditSelect.addEventListener("change", async () => {
    memeCache = [];
    currentIndex = 0;
    showingFavorites = false;
    favToggleBtn.textContent = "🤍 Favoriten";
    memeContainer.innerHTML = `<div class="loading-spinner">Lade frische Memes...</div>`;
    await fetchMemes();
    renderMeme();
});

favToggleBtn.addEventListener("click", () => {
    showingFavorites = !showingFavorites;
    currentIndex = 0;
    favToggleBtn.textContent = showingFavorites ? "⬅️ Zurück" : "🤍 Favoriten";
    subredditSelect.disabled = showingFavorites;
    renderMeme();
});

async function init() {
    memeContainer.innerHTML = `<div class="loading-spinner">Lade Memes...</div>`;
    await fetchMemes();
    renderMeme();
}

init();