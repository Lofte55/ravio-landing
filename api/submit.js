// ═══════════════════════════════════════════════════════════════════════
// RAVIO — защищённый бэкенд приёма заявок (Vercel Serverless Function)
// Путь запроса: POST /api/submit
//
// Здесь, и ТОЛЬКО здесь, живут все секреты. Они берутся из переменных
// окружения Vercel (Project → Settings → Environment Variables), а НЕ из кода:
//
//   TELEGRAM_BOT_TOKEN     — токен бота от @BotFather
//   TELEGRAM_CHAT_ID       — id чата/канала для заявок
//   GOOGLE_SHEETS_URL      — URL Apps Script (doPost)
//   EMAILJS_SERVICE_ID     — EmailJS Service ID
//   EMAILJS_TEMPLATE_ID    — EmailJS Template ID
//   EMAILJS_PUBLIC_KEY     — EmailJS Public Key
//   EMAILJS_PRIVATE_KEY    — EmailJS Private Key (accessToken для серверных вызовов)
//   EMAILJS_TO_EMAIL       — куда слать письмо (например amdk55@yandex.ru)
//   ALLOWED_ORIGIN         — (опц.) https://calculator-ravio.kz — ограничение источника
//
// Защиты: только POST, проверка Origin, honeypot, проверка «возраста» формы,
// идемпотентность (антидубль), rate-limit + throttling по IP, строгая
// валидация входных данных, ограничение размера тела, security-заголовки.
// ═══════════════════════════════════════════════════════════════════════

// ── In-memory хранилища (на один инстанс; сбрасываются при «холодном» старте).
//    Для строгих гарантий на проде используйте Vercel KV / Upstash Redis —
//    код ниже изолирован в функциях rateLimit() и idempotent(), их легко заменить.
const ipHits = new Map();    // ip -> [timestamps]
const seenKeys = new Map();  // idempotencyKey -> timestamp

const WINDOW_MS       = 10 * 60 * 1000; // окно rate-limit: 10 минут
const MAX_PER_WINDOW  = 5;              // максимум заявок с одного IP за окно
const MIN_INTERVAL_MS = 8 * 1000;       // throttle: не чаще 1 заявки в 8 сек с IP
const IDEMP_TTL_MS    = 30 * 60 * 1000; // антидубль: помним ключ 30 минут
const MIN_FORM_AGE_MS = 2500;           // форма «моложе» — почти наверняка бот
const MAX_BODY_BYTES  = 16 * 1024;      // максимум 16 КБ тела запроса

// Разрешённые значения (whitelist) — всё, что вне списка, отбрасывается.
const ALLOWED = {
  contact: ["whatsapp", "telegram", "call"],
  timing:  ["asap", "month", "quarter", "planning"],
  rooms:   ["1", "2", "3", "4+"],
  condition: ["new_building", "secondary_normal", "old_full_repair", "very_bad"],
  scope:   ["full_repair", "selected_stages", "not_sure"],
  stages:  ["demolition","wasteRemoval","roughWorks","electric","plumbing",
            "bathroom","kitchen","ceiling","floor","walls"],
};

// ── Словарь человекочитаемых меток
const RU = {
  new_building:"Новостройка", secondary_normal:"Вторичка (норм)",
  old_full_repair:"Старый ремонт", very_bad:"Убитое состояние",
  full_repair:"Весь ремонт", selected_stages:"Выбранные этапы", not_sure:"Ориентир",
  demolition:"Демонтаж", wasteRemoval:"Вывоз мусора", roughWorks:"Черновые работы",
  electric:"Электрика", plumbing:"Сантехника", bathroom:"Санузел",
  kitchen:"Кухня", ceiling:"Потолки", floor:"Полы", walls:"Стены",
  whatsapp:"WhatsApp", telegram:"Telegram", call:"Звонок",
  asap:"Как можно скорее", month:"В течение месяца", quarter:"В этом квартале", planning:"Пока планирую",
};
const ru = (v) => RU[v] || v || "—";
const money = (n) => (Number(n) || 0).toLocaleString("ru-RU") + " ₸";

// ── Утилиты ─────────────────────────────────────────────────────────────
function clean(map, ttl) {
  const now = Date.now();
  for (const [k, v] of map) {
    const t = Array.isArray(v) ? (v[v.length - 1] || 0) : v;
    if (now - t > ttl) map.delete(k);
  }
}
function getIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}
function rateLimit(ip) {
  clean(ipHits, WINDOW_MS);
  const now = Date.now();
  const arr = (ipHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length && now - arr[arr.length - 1] < MIN_INTERVAL_MS) return "throttle";
  if (arr.length >= MAX_PER_WINDOW) return "rate";
  arr.push(now);
  ipHits.set(ip, arr);
  return "ok";
}
function idempotent(key) {
  if (!key) return false;            // нет ключа — не дедупим
  clean(seenKeys, IDEMP_TTL_MS);
  if (seenKeys.has(key)) return true; // уже видели — это повтор
  seenKeys.set(key, Date.now());
  return false;
}
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve) => {
    let data = "", size = 0, tooBig = false;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) { tooBig = true; return; }
      data += c;
    });
    req.on("end", () => {
      if (tooBig) return resolve(null);
      try { resolve(JSON.parse(data || "{}")); } catch { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}
function str(v, max) { return typeof v === "string" ? v.slice(0, max) : ""; }

// ── Валидация заявки ────────────────────────────────────────────────────
function validate(b) {
  const errors = [];
  const name = str(b.userName, 80).trim();
  if (name.length < 2) errors.push("name");

  const digits = str(b.userPhone, 30).replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 12) errors.push("phone");

  if (!ALLOWED.contact.includes(b.userContact)) errors.push("contact");
  if (!ALLOWED.timing.includes(b.userTiming)) errors.push("timing");

  const area = Number(b.area);
  if (!(area >= 10 && area <= 300)) errors.push("area");

  if (b.rooms && !ALLOWED.rooms.includes(String(b.rooms))) errors.push("rooms");
  if (b.condition && !ALLOWED.condition.includes(b.condition)) errors.push("condition");
  if (b.calculationScope && !ALLOWED.scope.includes(b.calculationScope)) errors.push("scope");

  let stages = Array.isArray(b.selectedStages) ? b.selectedStages : [];
  stages = stages.filter((s) => ALLOWED.stages.includes(s)).slice(0, 10);

  return {
    ok: errors.length === 0,
    errors,
    clean: {
      userName: name,
      userPhone: str(b.userPhone, 30).trim(),
      userContact: b.userContact,
      userTiming: b.userTiming,
      area: String(area),
      rooms: String(b.rooms || ""),
      condition: b.condition || "",
      calculationScope: b.calculationScope || "",
      selectedStages: stages,
      stageAreas: (b.stageAreas && typeof b.stageAreas === "object") ? b.stageAreas : {},
      // детали этапов (для подробного сообщения) — берём как строки/числа, без доверия
      demolition: str(b.demolition, 20), roughItems: Array.isArray(b.roughItems) ? b.roughItems.slice(0,8) : [],
      radiatorCount: str(String(b.radiatorCount||""), 6),
      electricType: str(b.electricType,20), electricGrooving: str(b.electricGrooving,10), electricAge: str(b.electricAge,10),
      electricOutlets: str(String(b.electricOutlets||""),6), electricSwitches: str(String(b.electricSwitches||""),6), electricLights: str(String(b.electricLights||""),6),
      plumbing: str(b.plumbing,20), plumbingLocation: str(b.plumbingLocation,20), plumbingMeters: str(String(b.plumbingMeters||""),6),
      bathroomType: str(b.bathroomType,20), bathroomCount: str(String(b.bathroomCount||""),3), bathroomFixtureType: str(b.bathroomFixtureType,20),
      kitchen: str(b.kitchen,20), ceiling: str(b.ceiling,20),
      floorCovering: str(b.floorCovering,20), floorLeveling: str(b.floorLeveling,10),
      walls: str(b.walls,20), wallLeveling: str(b.wallLeveling,10),
      includeMaterials: b.includeMaterials === "yes" ? "yes" : "no",
      selectedProfileName: str(b.selectedProfileName, 60),
      totalMin: Number(b.totalMin) || 0,
      totalMax: Number(b.totalMax) || 0,
      workTotal: Number(b.workTotal) || 0,
      matCost: Number(b.matCost) || 0,
      compatibility: Number(b.compatibility) || 0,
      unavailableStages: Array.isArray(b.unavailableStages) ? b.unavailableStages.filter(s=>ALLOWED.stages.includes(s)) : [],
      // стоимость по этапам — только разрешённые ключи, числовые значения
      stageCosts: (b.stageCosts && typeof b.stageCosts === "object")
        ? Object.fromEntries(Object.entries(b.stageCosts)
            .filter(([k]) => ALLOWED.stages.includes(k))
            .map(([k, v]) => [k, Number(v) || 0])) : {},
      sid: str(b.sid, 40),
      leadType: b.leadType === "expert_audit" ? "expert_audit" : "contractor",
      // Источник рекламы (utm_* с фронта) — только строки, с обрезкой длины
      utm: (b.utm && typeof b.utm === "object") ? {
        source: str(b.utm.source, 60), medium: str(b.utm.medium, 60),
        campaign: str(b.utm.campaign, 80), content: str(b.utm.content, 80),
        term: str(b.utm.term, 80),
      } : null,
    },
  };
}

// ── Сборка детальных строк по этапам (с ценой по каждому) ────────────────
const STAGE_ORDER = ["demolition","wasteRemoval","roughWorks","electric","plumbing",
                     "bathroom","kitchen","ceiling","floor","walls"];
function stageLines(s) {
  const sa = s.stageAreas || {};
  const costs = s.stageCosts || {};
  // показываем в логическом порядке этапов
  const ordered = [...(s.selectedStages || [])].sort(
    (x, y) => STAGE_ORDER.indexOf(x) - STAGE_ORDER.indexOf(y)
  );
  return ordered.map((st) => {
    const a = sa[st] ? ` · ${sa[st]} м²` : "";
    const desc = (() => {
      switch (st) {
        case "demolition": return `  ⚒ Демонтаж: ${({light:"лёгкий (обои, плитка)",medium:"средний (перегородки, стяжка)",full:"полный (до бетона, трубы)"}[s.demolition]||"—")}${a}`;
        case "wasteRemoval": return `  🚛 Вывоз мусора`;
        case "roughWorks": return `  🧱 Черновые: ${((s.roughItems||[]).map(x=>({plastering:"штукатурка",screed:"стяжка",selfLeveling:"наливной пол",radiators:"радиаторы "+(s.radiatorCount||"")+"шт",soundproofing:"звукоизоляция"}[x]||x)).join(", ")||"—")}`;
        case "electric": return `  ⚡ Электрика${a}: розетки ${s.electricOutlets||0}, выключатели ${s.electricSwitches||0}, светильники ${s.electricLights||0}`;
        case "plumbing": return `  🚿 Сантехника: ${({partial:"частичная",full:"полная",from_scratch:"с нуля"}[s.plumbing]||"—")}${s.plumbingMeters?` · ${s.plumbingMeters} п.м.`:""}${s.plumbingLocation?` · ${({sanuzul:"санузел",kitchen:"кухня",all:"везде"}[s.plumbingLocation]||"")}`:""}`;
        case "bathroom": return `  🛁 Санузел: ${({replace_only:"замена сантехники",cosmetic:"косметика",partial:"частичный",full_1:"полный",full_2:"полный 2 санузла",from_scratch:"с нуля"}[s.bathroom]||"—")}${({shower:" · душевая",bath:" · ванна",both:" · душ+ванна"}[s.bathroomFixtureType]||"")}${a}`;
        case "kitchen": return `  🍳 Кухня: ${({basic:"обычный",with_apron:"с фартуком",from_scratch:"с нуля"}[s.kitchen]||"—")}${a}`;
        case "ceiling": return `  ▣ Потолки: ${({stretch:"натяжной",paint:"под покраску",gypsum:"гипсокартон"}[s.ceiling]||"—")}`;
        case "floor": return `  ▥ Полы: ${({linoleum:"линолеум",laminate:"ламинат",spc:"SPC/кварцвинил",tile:"плитка"}[s.floorCovering]||"—")}${s.floorLeveling==="yes"?" + выравнивание":""}`;
        case "walls": return `  ▤ Стены: ${({wallpaper:"обои",paint:"покраска",decorative:"декоративная"}[s.walls]||"—")}${s.wallLeveling==="yes"?" + штукатурка":""}`;
        default: return `  — ${st}`;
      }
    })();
    const c = Number(costs[st]) || 0;
    const unavailable = (s.unavailableStages || []).includes(st);
    const suffix = unavailable ? "  —  ⚠️ не выполняет" : (c > 0 ? `  —  ${money(c)}` : "");
    return desc + suffix;
  }).join("\n");
}

// ── Доставка: Telegram ──────────────────────────────────────────────────
async function toTelegram(s) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const unavail = (s.unavailableStages||[]).length
    ? `\n⚠️ Не выполняет: ${s.unavailableStages.map(ru).join(", ")}` : "";
  const audit = s.leadType === "expert_audit";
  const header = audit
    ? `🔍 <b>ЗАЯВКА НА НЕЗАВИСИМУЮ ПРОВЕРКУ (эксперт)</b>\n<i>Платная услуга — выезд эксперта</i>\n\n`
    : `🏗 <b>Новая заявка RAVIO · Павлодар</b>\n\n`;
  const text =
    header +
    `👤 <b>${s.userName}</b>\n` +
    `📞 ${s.userPhone} · ${ru(s.userContact)}\n` +
    `📅 ${ru(s.userTiming)}\n\n` +
    `📐 <b>Объект:</b> ${s.area} м² · ${s.rooms} комн. · ${ru(s.condition)}\n` +
    `🔧 <b>Тип расчёта:</b> ${ru(s.calculationScope)}\n` +
    `📦 Материалы: ${s.includeMaterials==="yes"?"Да (~37%)":"Нет"}\n\n` +
    `📋 <b>Этапы и детали:</b>\n${stageLines(s)}\n\n` +
    `💰 <b>${money(s.totalMin)} — ${money(s.totalMax)}</b>\n` +
    `   (работы: ${money(s.workTotal)}${s.includeMaterials==="yes"?` · матер: ~${money(s.matCost)}`:""})\n` +
    (audit ? `🔍 Тип: независимая проверка сметы/качества` : `🤝 ${s.selectedProfileName} · совм. ${s.compatibility}%${unavail}`) + `\n\n` +
    (s.utm && s.utm.source
      ? `📣 Источник: ${s.utm.source} / ${s.utm.medium || "—"} · ${s.utm.campaign || "—"}\n`
      : `📣 Источник: прямой заход / органика\n`) +
    `🕐 ${new Date().toLocaleString("ru-RU")}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }),
  });
}

// ── Доставка: Google Sheets ─────────────────────────────────────────────
async function toSheets(s) {
  const url = process.env.GOOGLE_SHEETS_URL;
  if (!url) return;
  const row = {
    submittedAt: new Date().toLocaleString("ru-RU"),
    userName: s.userName, userPhone: s.userPhone,
    userContact: ru(s.userContact), userTiming: ru(s.userTiming),
    area: s.area + " м²", rooms: s.rooms + " комн.",
    condition: ru(s.condition), calculationScope: ru(s.calculationScope),
    selectedStages: (s.selectedStages||[]).map(ru).join(", "),
    totalMin: money(s.totalMin), totalMax: money(s.totalMax),
    selectedProfileName: s.leadType === "expert_audit"
      ? "🔍 НЕЗАВИСИМАЯ ПРОВЕРКА (эксперт)" : s.selectedProfileName,
    utmSource: s.utm ? s.utm.source : "",
    utmMedium: s.utm ? s.utm.medium : "",
    utmCampaign: s.utm ? s.utm.campaign : "",
  };
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
}

// ── Доставка: Email (EmailJS, серверный вызов с private key) ─────────────
async function toEmail(s) {
  const service = process.env.EMAILJS_SERVICE_ID;
  const template = process.env.EMAILJS_TEMPLATE_ID;
  const pub = process.env.EMAILJS_PUBLIC_KEY;
  const priv = process.env.EMAILJS_PRIVATE_KEY;
  const to = process.env.EMAILJS_TO_EMAIL;
  if (!service || !template || !pub) return;
  const audit = s.leadType === "expert_audit";
  const message = [
    ...(audit ? ["🔍 ЗАЯВКА НА НЕЗАВИСИМУЮ ПРОВЕРКУ (эксперт) — платная услуга", ""] : []),
    `📞 ${s.userPhone}  |  ${ru(s.userContact)}`,
    `📅 ${ru(s.userTiming)}`, "",
    `🏠 ${s.area} м²  |  ${s.rooms} комн.  |  ${ru(s.condition)}`,
    `🔧 ${ru(s.calculationScope)}`,
    `📦 Материалы: ${s.includeMaterials==="yes"?"Да (~37%)":"Нет"}`, "",
    "── ЭТАПЫ ──", stageLines(s).replace(/^ {2}/gm, ""), "",
    "── СМЕТА ──",
    `💰 ${money(s.totalMin)} — ${money(s.totalMax)}`,
    audit ? `🔍 Тип: независимая проверка` : `👷 Подрядчик: ${s.selectedProfileName}`,
  ].join("\n");
  const body = {
    service_id: service, template_id: template, user_id: pub,
    template_params: { to_email: to || "", name: s.userName, time: new Date().toLocaleString("ru-RU"), message },
  };
  if (priv) body.accessToken = priv; // нужно для вызовов вне браузера
  await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Обработчик запроса ──────────────────────────────────────────────────
module.exports = async (req, res) => {
  // Security-заголовки
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");

  // CORS — разрешаем только свои источники. ALLOWED_ORIGIN можно задать списком
  // через запятую, например:
  //   https://calculator-ravio.kz,https://www.calculator-ravio.kz,https://ravio-calculator.vercel.app
  // Если переменная пуста — ограничение выключено (принимаем отовсюду).
  const allowedList = (process.env.ALLOWED_ORIGIN || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";
  if (allowedList.length) {
    // origin отсутствует у server-to-server/curl — таких пропускаем (их режет rate-limit);
    // если origin есть и он чужой — отказ.
    if (origin && !allowedList.includes(origin)) {
      return res.status(403).json({ ok:false, error:"forbidden_origin" });
    }
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"method_not_allowed" });

  const body = await readJson(req);
  if (!body) return res.status(400).json({ ok:false, error:"bad_body" });

  // Honeypot — скрытое поле должно быть пустым. Бот заполнил → молча «ок».
  if (typeof body.honeypot === "string" && body.honeypot.trim() !== "") {
    return res.status(200).json({ ok:true });
  }
  // Слишком быстрый сабмит — почти наверняка бот.
  if (typeof body.formAgeMs === "number" && body.formAgeMs < MIN_FORM_AGE_MS) {
    return res.status(200).json({ ok:true });
  }
  // Антидубль по idempotencyKey.
  if (idempotent(str(body.idempotencyKey, 64))) {
    return res.status(200).json({ ok:true, dedup:true });
  }
  // Rate-limit / throttling по IP.
  const verdict = rateLimit(getIp(req));
  if (verdict === "throttle") return res.status(429).json({ ok:false, error:"too_fast" });
  if (verdict === "rate")     return res.status(429).json({ ok:false, error:"rate_limited" });

  // Валидация.
  const v = validate(body);
  if (!v.ok) return res.status(422).json({ ok:false, error:"validation", fields:v.errors });

  // Доставка во все каналы. Ошибка одного не валит остальные.
  const results = await Promise.allSettled([
    toTelegram(v.clean),
    toSheets(v.clean),
    toEmail(v.clean),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(["telegram","sheets","email"][i], "fail:", r.reason && r.reason.message);
  });

  return res.status(200).json({ ok:true });
};
