# celesium-site

Brand website for **CelesiumAI LLC** — the AI development studio arm of Celesium Capital.

Live at: [celesium.ai](https://celesium.ai)

## Stack

Static HTML / CSS / vanilla JS. No build step. Deployed on Vercel.

## Structure

```
.
├── index.html          Home
├── portfolio.html      Products (BillXM, Vigilarx, Intelarx, CClinic, AI Incubator)
├── services.html       Services + process
├── about.html          Studio, leadership, parent company
├── contact.html        Contact form (Formspree) + office info
├── css/style.css       Design system
├── js/main.js          Mobile nav
├── favicon.svg         Constellation mark
├── robots.txt
├── sitemap.xml
└── vercel.json         cleanUrls + security headers
```

## Local preview

Any static server works. Quickest:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Pushes to `main` auto-deploy to production on Vercel. Pushes to any other branch create a preview URL.

## Contact form

The form on `contact.html` POSTs to Formspree (form ID `mzdyrgdk`). Submissions route to a Gmail inbox via Formspree's email notification.

To change the destination email: log into formspree.io → CelesiumAI Contact form → Workflow → Email action → update destination.

## Design tokens

Defined in `css/style.css`:

- Background: `#FAFAF5` (warm cream)
- Product palette: `#2563EB` BillXM · `#374151` Vigilarx · `#059669` Intelarx · `#DB2777` CClinic · `#D97706` AI Incubator
- Type: Outfit (headings) / DM Sans (body)
