// Läuft NICHT im Browser, sondern serverseitig via GitHub Actions.
// Holt Memes direkt von Reddit (kein CORS-Problem serverseitig) und schreibt memes.json.
const SUBREDDITS = ["memes", "wholesomememes", "cleanmemes", "ProgrammerHumor", "me_irl", "AnimalsBeingDerps"];

async function fetchSub(sub) {
  const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=100&raw_json=1`, {
    headers: { "User-Agent": "meme-website-fetch-bot/1.0 (by u/Rezyel83)" },
  });
  if (!res.ok) {
    console.error(`Fehler bei r/${sub}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return data.data.children.map(c => ({
    id: c.data.id,
    title: c.data.title,
    url: c.data.url,
    ups: c.data.ups,
    subreddit: c.data.subreddit,
    over_18: c.data.over_18,
    is_video: c.data.is_video,
    stickied: c.data.stickied,
  }));
}

const all = (await Promise.all(SUBREDDITS.map(fetchSub))).flat();
await import("node:fs/promises").then(fs =>
  fs.writeFile("memes.json", JSON.stringify(all, null, 2))
);
console.log(`${all.length} Posts geschrieben.`);