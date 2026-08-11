/* ═══════════════════════════════════════════════════════════════════════
   RAVIO — ПОДРЯДЧИКИ, ЦЕНЫ И КОЭФФИЦИЕНТЫ
   ───────────────────────────────────────────────────────────────────────
   ЭТО ЕДИНСТВЕННЫЙ ФАЙЛ, который нужно править для изменения цен и подрядчиков.
   Интерфейс (index.html) трогать НЕ нужно.

   ── ОТКУДА ЦЕНЫ ──
   Все 4 подрядчика — РЕАЛЬНЫЕ прайсы (Павлодар):
   • contractor_1 "СтройФормат" — прайс 2022 с индексацией ~+30% к 2026.
   • contractor_2 "TodiRash", contractor_3 "Антон", contractor_4 "ИП Нариман"
     — реальные прайсы, август 2026 (из присланных таблиц).
   Позиции «от»/пустые оценены по заметкам прайса или соседним подрядчикам.
   Стены (walls*M2, wallLevelingM2) — цена за м² стены × 2.6 (за м² квартиры).
   plasteringM2 (черновые) — за м² стены напрямую (движок сам ×2.6).
   independent — среднерыночный ориентир (не пересчитывался).

   ── ЕДИНИЦЫ ИЗМЕРЕНИЯ (важно! так считает index.html) ──
   • walls*M2 и wallLevelingM2 — за м² КВАРТИРЫ (множитель стен ×2.6 уже
     зашит в цену: цена работ за м² стен × 2.6)
   • plasteringM2 (черновые) — за м² СТЕН (движок сам умножает на 2.6)
   • полы, потолки, стяжка, демонтаж — за м² квартиры
   • *Fixed — фикс. за пакет работ;  *Price — за 1 шт;  *Meter* — за 1 п.м
   • materialsPercent — доля материалов от стоимости работ (0.50 = +50%)

   ── КАК ИЗМЕНИТЬ ЦЕНУ ──
   Найди нужного подрядчика ниже → внутри его блока "prices" поменяй число.

   ── КАК ДОБАВИТЬ НОВОГО ПОДРЯДЧИКА ──
   Скопируй любой блок { ... } внутри "contractors: [ ... ]",
   вставь рядом (через запятую) и поменяй:
     • id        — уникальный, латиницей (contractor_3, contractor_4 …)
     • name      — название (видит клиент)
     • rating    — звёзды 4.0–5.0 (или null если нет)
     • priceLevel— "cheap" (дешёвый) / "mid" (средний) / "premium" (дорогой)
     • services  — true = делает этот этап, false = НЕ делает
     • prices    — его цены (если services:false для этапа → ставь 0)

   ВАЖНО: после правок — сохранить файл и сообщить, чтобы залить на сайт.
   Цены видны в браузере (калькулятор считает у клиента) — это не секрет,
   секреты (токены) лежат отдельно на сервере.
   ═══════════════════════════════════════════════════════════════════════ */

window.RAVIO_CONFIG = {
  city: "Павлодар",
  localEstimatesCount: 2480,

  // ── БАЗОВЫЙ ОРИЕНТИР (рыночная независимая оценка) ──
  independent: {
    id: "independent", name: "Независимая оценка",
    type: "baseline", subtitle: "Рыночный ориентир",
    services: {
      demolition:true, wasteRemoval:true, roughWorks:true,
      electric:true, plumbing:true, bathroom:true,
      kitchen:true, ceiling:true, floor:true, walls:true,
    },
    prices: {
      demolitionLightM2:  2700,   // калибровка по реальному кейсу 2026
      demolitionMediumM2: 3500,
      demolitionFullM2:   5000,
      wasteRemovalFixed:  75000,
      plasteringM2:    3000,      // за м² стен, под маяк готовыми смесями
      screedM2:        3300,
      selfLevelingM2:  2200,      // наливной + грунт-пропитка
      radiatorUnit:   16000,
      soundproofingM2: 4800,      // утеплитель + обшивка ГКЛ
      electricOutletPrice:  3300, // розетка + точка выхода
      electricSwitchPrice:  3300,
      electricLightPrice:   5500, // точка + монтаж светильника/софита
      plumbingMeterPartial: 2800,
      plumbingMeterFull:    3400,
      plumbingPartialFixed: 130000,
      plumbingFullFixed:    270000,
      plumbingRiserUnit:    28000,  // замена 1 стояка воды (гор. или хол.)
      plumbingSewerFixed:   65000,  // замена канализационного стояка
      electricGroovingM2:  3700,        // штрабление + прокладка ₸/м²
      bathroomReplaceFixed:    90000,   // только замена сантехники
      bathroomCosmeticFixed:   160000,
      bathroomPartialFixed:    240000,  // частичный ремонт
      bathroomFullOneFixed:    520000,
      bathroomFullTwoFixed:    950000,
      kitchenBasicFixed:       300000,
      kitchenWithApronFixed:   370000,
      ceilingStretchM2:  2300,          // реальная цена рынка 2026
      ceilingPaintM2:    6800,          // шпатлёвка потолочная + покраска
      ceilingGypsumM2:   11800,         // каркас + ГКЛ + отделка
      floorLinoleumM2:   1700,
      floorLaminateM2:   2500,
      floorSpcM2:        3100,
      floorTileM2:       5200,
      floorLevelingM2:   2200,
      wallsWallpaperM2:  13300,   // за м² квартиры (композит × 2.6 стен)
      wallsPaintM2:      16500,   // шпатл. + стеклохолст + покраска × 2.6
      wallsDecorativeM2: 36000,   // декоративная с подготовкой × 2.6
      wallLevelingM2:    8000,    // штукатурка под маяк × 2.6
      materialsPercent:  0.50,
    },
    priceLevel: "mid", rating: null,
  },

  // ── ПОДРЯДЧИКИ (добавляй сюда новые блоки) ──
  contractors: [
    {
      // РЕАЛЬНЫЙ прайс (2022, индексация +30% к 2026)
      id: "contractor_1", name: "СтройФормат",
      type: "team", subtitle: "Бригада отделочников",
      rating: 4.6, priceLevel: "cheap",
      services: {
        demolition:true, wasteRemoval:false, roughWorks:true,
        electric:true, plumbing:true, bathroom:true,
        kitchen:true, ceiling:true, floor:true, walls:true,
      },
      prices: {
        // РЕАЛЬНЫЙ факт 2026: 120 000 ₸ за 46 м² (пол деревянный + обои + плитка) ≈ 2600 ₸/м²
        demolitionLightM2:2600, demolitionMediumM2:3400, demolitionFullM2:4800,
        wasteRemovalFixed:0,
        plasteringM2:2900,          // под маяк готовыми смесями 2000–2500 ×1.3
        screedM2:3200,              // стяжка до 5 / 5–12 см ×1.3
        selfLevelingM2:2100,        // наливной 1000–1200 + грунт 500 ×1.3
        radiatorUnit:15000,         // РЕАЛЬНАЯ цена 2026
        soundproofingM2:4500,       // утеплитель 700 + ГКЛ с утеплением ×1.3
        electricOutletPrice:3200,   // розетка 1500 + точка 1000 ×1.3
        electricSwitchPrice:3200,
        electricLightPrice:5000,    // точка + бра/софит/плафон ×1.3
        plumbingMeterPartial:2600,  // полипропилен 1800–2500 ×1.3
        plumbingMeterFull:3200,
        plumbingPartialFixed:120000,
        plumbingFullFixed:250000,
        plumbingRiserUnit:25000,    // РЕАЛЬНАЯ цена 2026: 25 000 ₸ за стояк
        plumbingSewerFixed:50000,   // РЕАЛЬНАЯ цена 2026: замена канализации
        electricGroovingM2:3500,    // электрика 1500 п.м ≈ 2 п.м на м² ×1.3
        bathroomReplaceFixed:80000,   // приборы 3×10000 + подключение ×1.3
        bathroomCosmeticFixed:150000, // панели ПВХ + потолок + мелочи
        bathroomPartialFixed:220000,  // плитка частично + приборы
        bathroomFullOneFixed:480000,  // плитка ~28м² × 6000–9000 + всё
        bathroomFullTwoFixed:900000,
        kitchenBasicFixed:280000,
        kitchenWithApronFixed:340000, // + фартук кафель 3000–4000 ×1.3
        ceilingStretchM2:2200,        // РЕАЛЬНАЯ цена 2026
        ceilingPaintM2:6400,          // шпатлёвка потолочная (+500) + покраска ×1.3
        ceilingGypsumM2:11000,        // каркас+ГКЛ ~3500 + отделка ×1.3
        floorLinoleumM2:1600,         // настил 1200 ×1.3
        floorLaminateM2:2300,         // укладка с подложкой 1600–2000 ×1.3
        floorSpcM2:2900,
        floorTileM2:4900,             // плитка пол 3500–4000 ×1.3
        floorLevelingM2:2100,         // наливной + грунт ×1.3
        wallsWallpaperM2:12500,       // (шпатл 2сл+финиш+грунт+обои) ×1.3 ×2.6
        wallsPaintM2:15500,           // (шпатл+стеклохолст+грунт+покраска) ×1.3 ×2.6
        wallsDecorativeM2:34000,      // декоративная 10000–14000 ×1.3 ×2.6
        wallLevelingM2:7500,          // штукатурка под маяк ×1.3 ×2.6
        materialsPercent:0.50,
      },
    },
    {
      // РЕАЛЬНЫЙ прайс подрядчика (август 2026). Стены: цена за м² стены × 2.6.
      id: "contractor_2", name: "TodiRash",
      type: "team", subtitle: "Бригада отделочников",
      rating: 4.5, priceLevel: "mid",
      services: {
        demolition:true, wasteRemoval:true, roughWorks:true,
        electric:true, plumbing:true, bathroom:true,
        kitchen:true, ceiling:true, floor:true, walls:true,
      },
      prices: {
        demolitionLightM2:3000, demolitionMediumM2:4000, demolitionFullM2:11000, // full — оценка (не выполняют)
        wasteRemovalFixed:45000,      // один рейс/газель, вкл. грузчиков
        plasteringM2:3600, screedM2:3600, selfLevelingM2:2200, radiatorUnit:20000, soundproofingM2:500,
        electricOutletPrice:9000, electricSwitchPrice:9000, electricLightPrice:3000, electricGroovingM2:1500,
        plumbingMeterPartial:3000, plumbingMeterFull:3000,
        plumbingPartialFixed:150000, plumbingFullFixed:300000, // оценка (считают по точкам)
        plumbingRiserUnit:25000, plumbingSewerFixed:50000,     // оценка
        bathroomReplaceFixed:100000, bathroomCosmeticFixed:400000, bathroomPartialFixed:400000,
        bathroomFullOneFixed:600000, bathroomFullTwoFixed:1200000,
        kitchenBasicFixed:170000, kitchenWithApronFixed:170000,
        ceilingStretchM2:4000, ceilingPaintM2:1500, ceilingGypsumM2:7000,
        floorLinoleumM2:1500, floorLaminateM2:4000, floorSpcM2:4000, floorTileM2:8500, floorLevelingM2:4000,
        wallsWallpaperM2:5200, wallsPaintM2:2600, wallsDecorativeM2:13000, wallLevelingM2:3400, // ×2.6 от м² стены
        materialsPercent:0.40,
      },
    },
    {
      // РЕАЛЬНЫЙ прайс (август 2026). Частный мастер, много позиций «от» → часть оценена.
      id: "contractor_3", name: "Антон",
      type: "solo", subtitle: "Частный мастер",
      rating: 4.4, priceLevel: "mid",
      services: {
        demolition:true, wasteRemoval:true, roughWorks:true,
        electric:true, plumbing:true, bathroom:true,
        kitchen:true, ceiling:true, floor:true, walls:true,
      },
      prices: {
        demolitionLightM2:4000, demolitionMediumM2:8000, demolitionFullM2:11500,
        wasteRemovalFixed:65000,
        plasteringM2:4000, screedM2:4000, selfLevelingM2:2500, radiatorUnit:18000, soundproofingM2:3500,
        electricOutletPrice:5000, electricSwitchPrice:3800, electricLightPrice:3200, electricGroovingM2:3000,
        plumbingMeterPartial:9000, plumbingMeterFull:14500,
        plumbingPartialFixed:260000, plumbingFullFixed:620000,
        plumbingRiserUnit:30000, plumbingSewerFixed:65000,
        bathroomReplaceFixed:95000, bathroomCosmeticFixed:175000, bathroomPartialFixed:260000,
        bathroomFullOneFixed:560000, bathroomFullTwoFixed:1050000,
        kitchenBasicFixed:500000, kitchenWithApronFixed:750000,
        ceilingStretchM2:4000, ceilingPaintM2:8000, ceilingGypsumM2:8500,
        floorLinoleumM2:1800, floorLaminateM2:2600, floorSpcM2:3300, floorTileM2:8500, floorLevelingM2:2000,
        wallsWallpaperM2:7800, wallsPaintM2:10400, wallsDecorativeM2:26000, wallLevelingM2:6500, // ×2.6 от м² стены
        materialsPercent:0.40,
      },
    },
    {
      // РЕАЛЬНЫЙ прайс (август 2026). ИП Нариман — премиум-сегмент, высокие расценки.
      id: "contractor_4", name: "ИП Нариман",
      type: "company", subtitle: "Ремонтная компания",
      rating: 4.7, priceLevel: "premium",
      services: {
        demolition:true, wasteRemoval:true, roughWorks:true,
        electric:true, plumbing:true, bathroom:true,
        kitchen:true, ceiling:true, floor:true, walls:true,
      },
      prices: {
        demolitionLightM2:10000, demolitionMediumM2:10000, demolitionFullM2:30000,
        wasteRemovalFixed:50000,
        plasteringM2:4000, screedM2:5500, selfLevelingM2:2500, radiatorUnit:35000, soundproofingM2:4000,
        electricOutletPrice:10000, electricSwitchPrice:10000, electricLightPrice:30000, electricGroovingM2:10000,
        plumbingMeterPartial:15000, plumbingMeterFull:25000,
        plumbingPartialFixed:150000, plumbingFullFixed:300000,
        plumbingRiserUnit:30000, plumbingSewerFixed:65000,
        bathroomReplaceFixed:200000, bathroomCosmeticFixed:175000, bathroomPartialFixed:350000,
        bathroomFullOneFixed:900000, bathroomFullTwoFixed:2000000,
        kitchenBasicFixed:500000, kitchenWithApronFixed:600000,
        ceilingStretchM2:5000, ceilingPaintM2:5500, ceilingGypsumM2:8000,
        floorLinoleumM2:3000, floorLaminateM2:5000, floorSpcM2:7000, floorTileM2:10000, floorLevelingM2:4000,
        wallsWallpaperM2:7800, wallsPaintM2:11700, wallsDecorativeM2:26000, wallLevelingM2:9100, // ×2.6 от м² стены
        materialsPercent:0.45,
      },
    },
  ],

  // ── КОЭФФИЦИЕНТЫ (трогать осторожно) ──
  coefs: {
    condition: { new_building:1.00, secondary_normal:1.10, old_full_repair:1.25, very_bad:1.40 },
    living:    { yes:1.07, no:1.0 },
    lift:      { yes:1.0,  no:1.03 },
    plumbingLocation: { sanuzul:1.0, kitchen:0.8, all:1.5, "":1.0 },
  },

  // диапазон погрешности итоговой суммы (±)
  range: { min:0.90, max:1.15 },
};
