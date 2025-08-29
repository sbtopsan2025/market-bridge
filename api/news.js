// api/news.js
import { fetch } from "undici";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

export default async (req, res) => {
  const q = (req.query.query || "").trim();
  const limit = Math.min(parseInt(req.query.limit || "5", 10), 10);
  if (!q) return res.status(400).json({ error: "query required" });

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  const r = await fetch(url);
  if (!r.ok) return res.status(502).json({ error: "upstream error" });

  const xml = await r.text();
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item || [];

  const normalized = items.slice(0, limit).map(it => ({
    title: it.title,
    link: it.link,
    pubDate: it.pubDate,
    source: "google_news_rss"
  }));

  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=1800");
  res.setHeader("Access-Control-Allow-Origin", "*");

  return res.json({
    fetched_at: new Date().toISOString(),
    query: q,
    articles: normalized
  });
};
