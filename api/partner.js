// RAVIO Landing — приём партнёрских заявок (бригады/компании)
// Vercel Serverless Function. Env vars (те же, что у калькулятора):
//   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
//   TELEGRAM_CHAT_ID   — id чата/канала для заявок
//   ALLOWED_ORIGIN     — список разрешённых origin через запятую (опционально)

const ipHits = new Map(); // ip -> [timestamps]
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

function str(v, max) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function rateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) ipHits.clear();
  return hits.length > RATE_MAX;
}

export default async function handler(req, res) {
  const allowedList = (process.env.ALLOWED_ORIGIN || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";
  if (allowedList.length && allowedList.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (rateLimited(ip)) return res.status(429).json({ error: "rate" });

  const b = req.body || {};
  const name = str(b.name, 80).trim();
  const phone = str(b.phone, 30).trim();
  const digits = phone.replace(/\D/g, "");
  const channel = ["WhatsApp", "Telegram"].includes(b.channel) ? b.channel : "WhatsApp";
  const who = str(b.who, 40).trim();
  const stages = Array.isArray(b.stages)
    ? b.stages.map((s) => str(s, 20)).filter(Boolean).slice(0, 12)
    : [];

  if (!name || digits.length < 10 || digits.length > 12) {
    return res.status(400).json({ error: "validation" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(500).json({ error: "config" });

  const text =
    `🤝 Новая партнёрская заявка (лендинг)\n\n` +
    `👤 ${name} · ${who || "—"}\n` +
    `📞 ${phone} · ${channel}\n` +
    `🛠 Этапы: ${stages.length ? stages.join(", ") : "—"}\n` +
    `🌐 ${str(b.page, 200)}`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
    if (!r.ok) throw new Error("tg " + r.status);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ error: "send" });
  }
}
