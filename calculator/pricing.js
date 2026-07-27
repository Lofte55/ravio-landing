/* ═══════════════════════════════════════════════════════════════════════
   RAVIO — ПОДРЯДЧИКИ, ЦЕНЫ И КОЭФФИЦИЕНТЫ
   ───────────────────────────────────────────────────────────────────────
   ЭТО ЕДИНСТВЕННЫЙ ФАЙЛ, который нужно править для изменения цен и подрядчиков.
   Интерфейс (index.html) трогать НЕ нужно.

   ── ОТКУДА ЦЕНЫ ──
   contractor_1 "СтройФормат" — РЕАЛЬНЫЙ прайс подрядчика (Павлодар, 2022)
   с мягкой индексацией к 2026 году (~+30%). Составные позиции калькулятора
   (обои, покраска и т.п.) собраны из отдельных операций прайса:
   например «Обои м²» = шпатлёвка 2 слоя + финиш + грунт + поклейка.
   contractor_2 "РемПро" — выдуманный, чуть дороже (+8–20% выборочно).
   independent — среднерыночный ориентир (≈ среднее двух + округление).

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
      // Выдуманный, чуть дороже реального (+8–20% выборочно)
      id: "contractor_2", name: "РемПро",
      type: "company", subtitle: "Строительная компания",
      rating: 4.8, priceLevel: "mid",
      services: {
        demolition:true, wasteRemoval:true, roughWorks:true,
        electric:true, plumbing:true, bathroom:true,
        kitchen:true, ceiling:true, floor:true, walls:true,
      },
      prices: {
        demolitionLightM2:2800, demolitionMediumM2:3700, demolitionFullM2:5200,
        wasteRemovalFixed:75000,
        plasteringM2:3200, screedM2:3500, selfLevelingM2:2300, radiatorUnit:17000, soundproofingM2:5000,
        electricOutletPrice:3500, electricSwitchPrice:3500, electricLightPrice:6000,
        plumbingMeterPartial:3000, plumbingMeterFull:3600,
        plumbingPartialFixed:140000, plumbingFullFixed:290000,
        plumbingRiserUnit:30000, plumbingSewerFixed:80000,
        electricGroovingM2:3900, bathroomReplaceFixed:95000, bathroomPartialFixed:260000,
        bathroomCosmeticFixed:175000, bathroomFullOneFixed:560000, bathroomFullTwoFixed:1050000,
        kitchenBasicFixed:320000, kitchenWithApronFixed:390000,
        ceilingStretchM2:2500, ceilingPaintM2:7200, ceilingGypsumM2:12500,
        floorLinoleumM2:1800, floorLaminateM2:2600, floorSpcM2:3300, floorTileM2:5500, floorLevelingM2:2400,
        wallsWallpaperM2:14000, wallsPaintM2:17500, wallsDecorativeM2:38000, wallLevelingM2:8500,
        materialsPercent:0.52,
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
