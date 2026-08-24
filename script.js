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

async function fetchMemes() {
    if (isLoading || showingFavorites) return;
    isLoading = true;

    try {
        const subreddit = subredditSelect.value;
        console.log(`Lade Memes von r/${subreddit}...`);
        
        const response = await fetch(`https://meme-api.com/gimme/${subreddit}/50`);
        const data = await response.json();

        if (data && data.memes && data.memes.length > 0) {
            // Nur Posts mit gültigen Bild-URLs nehmen
            const newMemes = data.memes.filter(m => m.url && (m.url.endsWith(".jpg") || m.url.endsWith(".png") || m.url.endsWith(".jpeg") || m.url.includes("i.redd.it")));
            memeCache.push(...newMemes);
            console.log(`${newMemes.length} Memes erfolgreich geladen.`);
        } else {
            console.warn("Keine Memes von der API erhalten.");
        }
    } catch (error) {
        console.error("Netzwerkfehler beim Laden der Memes:", error);
    } finally {
        isLoading = false;
    }
}

function getActiveList() {
    if (showingFavorites) {
        return getFavorites();
    }
    return memeCache;
}

function renderMeme() {
    const list = getActiveList();

    if (list.length === 0) {
        memeContainer.innerHTML = `<div class="loading-spinner">${showingFavorites ? "Noch keine Favoriten gespeichert." : "Lade Memes... (Falls das dauert, wechsle das Subreddit oben)"}</div>`;
        counter.textContent = "0 / 0";
        return;
    }

    currentIndex = Math.max(0, Math.min(currentIndex, list.length - 1));
    const meme = list[currentIndex];
    
    const favs = getFavorites();
    const isFav = favs.some(f => f.url === meme.url);

    memeContainer.innerHTML = `
        <img src="${meme.url}" alt="${meme.title || 'Meme'}" onerror="this.src='https://via.placeholder.com/400x300?text=Bild+konnte+nicht+geladen+werden'">
        <div class="meme-info">
            <div class="meme-title">${meme.title || 'Kein Titel'}</div>
            <div class="meme-meta">
                <span>⬆️ ${meme.ups || 0}</span>
                <button class="like-btn" id="favBtn">${isFav ? "❤️" : "🤍"}</button>
            </div>
        </div>
    `;

    counter.textContent = `${currentIndex + 1} / ${list.length}`;

    const favButton = document.getElementById("favBtn");
    if (favButton) {
        favButton.addEventListener("click", () => {
            toggleFavorite(meme);
        });
    }

    if (!showingFavorites && memeCache.length - currentIndex < 10) {
        fetchMemes();
    }
}

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

prevBtn.addEventListener("click", () => move(-1));
nextBtn.addEventListener("click", () => move(1));

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        move(-1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        move(1);
    }
});

window.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
        move(1);
    } else {
        move(-1);
    }
}, { passive: true });

subredditSelect.addEventListener("change", async () => {
    memeCache = [];
    currentIndex = 0;
    showingFavorites = false;
    favToggleBtn.textContent = "🤍 Favoriten";
    
    memeContainer.innerHTML = `<div class="loading-spinner">Lade r/${subredditSelect.value}...</div>`;
    await fetchMemes();
    renderMeme();
});

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

async function init() {
    memeContainer.innerHTML = `<div class="loading-spinner">Lade Memes...</div>`;
    await fetchMemes();
    renderMeme();
}

init();