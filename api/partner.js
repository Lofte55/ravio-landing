// RAVIO Landing — приём партнёрских заявок (бригады/компании)
// Vercel Serverless Function. Env vars (те же значения, что в проекте калькулятора):
//   TELEGRAM_BOT_TOKEN   — токен бота от @BotFather
//   TELEGRAM_CHAT_ID     — id чата/канала для заявок
//   EMAILJS_SERVICE_ID   — EmailJS: сервис
//   EMAILJS_TEMPLATE_ID  — EmailJS: шаблон
//   EMAILJS_PUBLIC_KEY   — EmailJS: public key
//   EMAILJS_PRIVATE_KEY  — EmailJS: private key (для серверных вызовов)
//   EMAILJS_TO_EMAIL     — куда слать письмо
//   ALLOWED_ORIGIN       — список разрешённых origin через запятую (опционально)

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

// ── Доставка: Telegram ──────────────────────────────────────────────────
async function toTelegram(s) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const text =
    `🤝 <b>Партнёрская заявка · лендинг RAVIO</b>\n\n` +
    `👤 <b>${s.name}</b> · ${s.who || "—"}\n` +
    `📞 ${s.phone} · ${s.channel}\n` +
    `🛠 Этапы: ${s.stages.length ? s.stages.join(", ") : "—"}\n\n` +
    `🌐 ${s.page}\n` +
    `🕐 ${new Date().toLocaleString("ru-RU")}`;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }),
  });
  return r.ok;
}

// ── Доставка: Email (EmailJS, серверный вызов с private key) ─────────────
async function toEmail(s) {
  const service = process.env.EMAILJS_SERVICE_ID;
  const template = process.env.EMAILJS_TEMPLATE_ID;
  const pub = process.env.EMAILJS_PUBLIC_KEY;
  const priv = process.env.EMAILJS_PRIVATE_KEY;
  const to = process.env.EMAILJS_TO_EMAIL;
  if (!service || !template || !pub) return false;
  const message = [
    "🤝 ПАРТНЁРСКАЯ ЗАЯВКА (лендинг RAVIO)",
    "",
    `👤 ${s.name}  |  ${s.who || "—"}`,
    `📞 ${s.phone}  |  ${s.channel}`,
    `🛠 Этапы: ${s.stages.length ? s.stages.join(", ") : "—"}`,
    "",
    `🌐 ${s.page}`,
  ].join("\n");
  const body = {
    service_id: service, template_id: template, user_id: pub,
    template_params: { to_email: to || "", name: s.name, time: new Date().toLocaleString("ru-RU"), message },
  };
  if (priv) body.accessToken = priv; // нужно для вызовов вне браузера
  const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.ok;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const allowedList = (process.env.ALLOWED_ORIGIN || "")
    .split(",").map((x) => x.trim()).filter(Boolean);
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
  const s = {
    name: str(b.name, 80).trim(),
    phone: str(b.phone, 30).trim(),
    channel: ["WhatsApp", "Telegram"].includes(b.channel) ? b.channel : "WhatsApp",
    who: str(b.who, 40).trim(),
    stages: Array.isArray(b.stages)
      ? b.stages.map((x) => str(x, 20)).filter(Boolean).slice(0, 12)
      : [],
    page: str(b.page, 200),
  };

  const digits = s.phone.replace(/\D/g, "");
  if (!s.name || digits.length < 10 || digits.length > 12) {
    return res.status(400).json({ error: "validation" });
  }

  const hasTg = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  const hasEmail = !!(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY);
  if (!hasTg && !hasEmail) {
    // Диагностика: какие переменные не заданы (только имена, без значений)
    const missing = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY"]
      .filter((k) => !process.env[k]);
    return res.status(500).json({ error: "config", missing });
  }

  const results = await Promise.allSettled([toTelegram(s), toEmail(s)]);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value === true);
  if (!delivered) return res.status(502).json({ error: "send" });
  return res.status(200).json({ ok: true });
}
