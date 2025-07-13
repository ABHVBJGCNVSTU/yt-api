const express = require("express");
const axios = require("axios");
const HttpsProxyAgent = require("https-proxy-agent");
const { Downloader } = require("abot-scraper");

const app = express();
const PORT = process.env.PORT || 3000;
const downloader = new Downloader();

const proxies = [
  "http://27.71.142.16:16000",
  "http://186.179.169.22:3128",
  "http://72.10.160.91:18749",
  "http://27.79.136.134:16000",
  "http://18.203.249.67:10010"
];

function getRandomProxy() {
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  return new HttpsProxyAgent(proxy);
}

app.get("/song", async (req, res) => {
  const query = req.query.q;
  const isVideo = req.query.type === "video";
  if (!query) return res.status(400).json({ error: "Missing query ?q=..." });

  try {
    const results = await downloader.searchYoutube(query);
    if (!results || results.length === 0)
      return res.status(404).json({ error: "No result found" });

    const selected = results[0];
    const data = await downloader.youtubeDownloader(selected.url);

    let downloadUrl = isVideo ? data.result.video : data.result.audio;
    if (!downloadUrl) return res.status(500).json({ error: "Failed to fetch link" });

    const axiosOptions = {
      method: "GET",
      url: downloadUrl,
      responseType: "stream"
    };

    if (!process.env.REPL_ID) {
      axiosOptions.httpsAgent = getRandomProxy();
    }

    const response = await axios(axiosOptions);
    const ext = isVideo ? "mp4" : "mp3";
    res.setHeader("Content-Disposition", `attachment; filename=download.${ext}`);
    response.data.pipe(res);

  } catch (e) {
    console.error("Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
