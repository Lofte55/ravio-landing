# RAVIO Landing — что сделано и как устроено

Чистый статический лендинг взамен Tilda-версии ravio.kz. Быстрый, SEO-готовый,
без сторонних конструкторов.

## Где что лежит

| Файл | Назначение |
|---|---|
| `index.html` | Главная. Один файл: инлайн CSS + JS, живой виджет расчёта, все секции. |
| `partners.html` | Страница `/partners` — для привлечения подрядчиков. Форма заявки. |
| `policy.html` | Политика конфиденциальности (`/policy`). |
| `api/partner.js` | Serverless-функция Vercel: приём партнёрских заявок → Telegram + Email. |
| `assets/logo.svg`, `assets/favicon.svg` | Логотип и фавикон. |
| `assets/fonts/` | Самохостинг шрифта Manrope (woff2, кириллица+латиница). |
| `sitemap.xml`, `robots.txt` | Для поисковиков. |
| `vercel.json` | Конфиг Vercel: cleanUrls, редиректы, security-заголовки, кэш ассетов. |

**Редактировать только эти файлы.** Виджет, анимации и форма — внутри `index.html`
и `partners.html` (в конце каждого файла, тег `<script>`).

## Хостинг и деплой

- **Хостинг:** Vercel, проект `ravio-landing`.
- **Репозиторий:** github.com/Lofte55/ravio-landing (ветка `main`).
- **Деплой:** автоматический — любой `git push` в `main` собирает новый деплой.
- **Тестовый адрес:** https://ravio-landing.vercel.app
- **Боевой домен:** ravio.kz (переезд DNS с Tilda — см. ниже).

Как обновить сайт: изменить файл → `git push` → Vercel сам пересоберёт (~1 мин).
Если деплой стал «Stale» — в Vercel Deployments у верхнего нажать ⋯ → Promote to Production.

## Форма партнёра — куда уходят заявки

`api/partner.js` шлёт заявку в два канала параллельно (успех, если сработал хотя бы один):

1. **Telegram** — бот @raviopartner_bot → чат `799401432`.
2. **Email** — через EmailJS (если заданы переменные, см. ACCESS.md).

Переменные окружения задаются в Vercel → проект ravio-landing → Settings →
Environment Variables (список — в ACCESS.md). После изменения переменных нужен Redeploy.

## Аналитика

- **Яндекс.Метрика**, счётчик `110354514` — на всех страницах. Вебвизор + карта кликов.
- Цели (создать в интерфейсе Метрики, тип «JavaScript-событие»):
  - `calc_click` — клик «Рассчитать ремонт» (переход в калькулятор)
  - `partners_click` — клик «Партнёрам» на главной
  - `partner_form_open` — открытие формы партнёра
  - `partner_lead` — успешная отправка заявки партнёра

## SEO

- Мета-теги, canonical, Open Graph — на каждой странице.
- Schema.org: LocalBusiness + WebSite + FAQPage (главная), Service + FAQPage (partners).
- sitemap.xml + robots.txt.
- Кнопки «Рассчитать» ведут на калькулятор: https://calculator-ravio.kz

## Переезд домена ravio.kz (осталось сделать)

Домен пока указывает на Tilda. Нужно у регистратора домена сменить DNS на записи,
которые показывает Vercel → ravio-landing → Settings → Domains
(обычно A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com` — брать значения с экрана Vercel).
После обновления DNS отвязать домен от Tilda.

## Связанные проекты

- **Калькулятор:** отдельный сайт calculator-ravio.kz (репозиторий ravio-calculator,
  проект Vercel ravio-calculator). Лендинг ведёт трафик на него.
