const BLACKLIST = [
  "nazi", "hitler", "nigger", "faggot", "retard", "rape",
  "sex", "porn", "nude", "naked", "boobs", "ass", "dick", "penis", "vagina",
  "kill", "murder", "suicide", "drug", "cocaine", "weed", "alcohol", "drunk",
  "gun", "shoot", "blood", "gore", "fuck", "shit", "bitch", "whore", "slut",
  "porno", "nackt", "titten", "arsch", "schwanz", "muschi",
  "töten", "mord", "selbstmord", "droge", "koks", "kokain",
  "besoffen", "waffe", "scheiße", "hure", "fotze", "nutte"
];

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

// NEU: Prüft den Text AUF dem Bild mittels OCR (Tesseract.js)
async function imageContainsBadWord(imageUrl) {
    try {
        // Tesseract erkennt Text im Bild (auf Deutsch und Englisch)
        const worker = await Tesseract.createWorker('eng+deu');
        const ret = await worker.recognize(imageUrl);
        await worker.terminate();

        const recognizedText = ret.data.text.toLowerCase();
        
        // Prüfen, ob ein Wort aus der Blacklist im Bildtext vorkommt
        for (let word of BLACKLIST) {
            if (recognizedText.includes(word.toLowerCase())) {
                console.log(`Bild blockiert wegen Text im Bild: "${word}"`);
                return true; // Enthält ein böses Wort
            }
        }
    } catch (err) {
        console.warn("OCR-Fehler beim Scannen des Bildes:", err);
    }
    return false; // Bild ist sauber
}

async function fetchMemes() {
    if (isLoading || showingFavorites) return;
    isLoading = true;

    try {
        const subreddit = subredditSelect.value;
        const response = await fetch(`https://meme-api.com/gimme/${subreddit}/50`);
        const data = await response.json();

        if (data && data.memes) {
            for (let m of data.memes) {
                // 1. Zuerst Titel und Typ prüfen
                if (!m.url || m.nsfw || !m.url.match(/\.(jpg|png|jpeg)$/i)) continue;
                
                const titleClean = m.title.toLowerCase();
                const titleHasBadWord = BLACKLIST.some(w => titleClean.includes(w));
                if (titleHasBadWord) continue;

                // 2. Jetzt das Bild nach Text scannen bevor es in den Cache kommt
                const isBadImage = await imageContainsBadWord(m.url);
                if (isBadImage) continue; // Überspringen, wenn Text im Bild verboten ist

                // Wenn alles sauber ist, hinzufügen
                memeCache.push(m);
                
                // Genug gesammelt für den Anfang?
                if (memeCache.length >= 15) break;
            }
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
        memeContainer.innerHTML = `<div class="loading-spinner">Scanne & Lade saubere Memes... (Kann einen Moment dauern)</div>`;
        counter.textContent = "0 / 0";
        return;
    }

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

    document.getElementById("favBtn").addEventListener("click", () => {
        toggleFavorite(meme);
    });

    if (!showingFavorites && memeCache.length - currentIndex < 5) {
        fetchMemes();
    }
}

function move(direction) {
    const list = getActiveList();
    if (list.length === 0) return;
    currentIndex = Math.max(0, Math.min(currentIndex + direction, list.length - 1));
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
    memeContainer.innerHTML = `<div class="loading-spinner">Analysiere Subreddit...</div>`;
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
    memeContainer.innerHTML = `<div class="loading-spinner">Lade & scanne Memes...</div>`;
    await fetchMemes();
    renderMeme();
}

init();