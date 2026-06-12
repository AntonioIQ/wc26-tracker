# Deploy y Créditos — Reglas del Proyecto

## Netlify Credits
- Plan gratuito: **300 créditos/mes**
- Cada production deploy gasta **15 créditos** (sea CLI o auto-build)
- Los pushes a GitHub **no gastan créditos**
- `netlify.toml` tiene `ignore = "exit 0"` para evitar auto-builds por push

## Reglas de Deploy

1. **NUNCA hacer `netlify deploy --prod` sin confirmación del usuario**
2. Acumular cambios y deployar en lotes — no uno por cada fix
3. Solo deployar cuando se cambia código del frontend (`app/app.js`, `app/index.html`, `app/styles.css`) o funciones de Netlify (`netlify/functions/`)
4. Los cambios a datos (`data/`, `picks/`, `results.json`, `leaderboard.json`) NO requieren deploy — la app los lee desde GitHub raw
5. Antes de deployar, confirmar con el usuario y mencionar cuántos créditos quedan

## Flujo de trabajo

```
1. Hacer cambios → git add → git commit → git push (gratis)
2. Solo si hay cambios en app/ o netlify/functions/:
   → Preguntar al usuario: "¿Deployamos? Quedan ~X créditos"
   → Si confirma: netlify deploy --dir=app --prod
```

## Qué NO requiere deploy
- Cambios a `data/results.json` (se leen de GitHub raw)
- Cambios a `data/leaderboard.json` (se leen de GitHub raw)
- Cambios a `data/picks/*.json` (se leen de GitHub raw)
- Cambios a `.github/workflows/` (GitHub Actions, no Netlify)
- Cambios a `scripts/` (se ejecutan en GitHub Actions)

## Qué SÍ requiere deploy
- `app/app.js` — lógica del frontend
- `app/index.html` — estructura HTML
- `app/styles.css` — estilos
- `netlify/functions/*.js` — funciones serverless
- `netlify.toml` — configuración de headers/redirects
