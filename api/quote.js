// api/quote.js
import { fetch } from "undici";

export default async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
  const r = await fetch(url);
  if (!r.ok) return res.status(502).json({ error: "upstream error" });

  const j = await r.json();
  const q = j?.quoteResponse?.result?.[0];
  if (!q) return res.status(404).json({ error: "symbol not found" });

  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  res.setHeader("Access-Control-Allow-Origin", "*"); // 方便瀏覽工具取用

  return res.json({
    source: "yahoo_finance",
    fetched_at: new Date().toISOString(),
    symbol: q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChange,
    change_pct: q.regularMarketChangePercent,
    currency: q.currency,
    market_time: new Date(q.regularMarketTime * 1000).toISOString(),
    note: "delayed ~15m"
  });
};
