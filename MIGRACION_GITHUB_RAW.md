# Migración: Datos desde GitHub Raw

## Qué cambia
El frontend ahora lee los datos (matches, results, leaderboard, etc.) directamente desde GitHub raw en vez de archivos estáticos en `app/data/`. Esto elimina la necesidad de redeploy en Netlify cada vez que cambian los datos.

## Por qué
- Cada deploy en Netlify cuesta 15 créditos (tienes 300/mes)
- Con el flujo anterior, cada actualización de resultados o picks disparaba un deploy
- Con este cambio, Netlify solo redeploya cuando cambias el frontend (HTML/CSS/JS), que es rara vez

## Pasos que debes hacer tú

### Paso 1: Hacer el repo público
1. Ve a https://github.com/AntonioIQ/wc26-tracker
2. Settings (la pestaña de arriba, no el engrane)
3. Baja hasta "Danger Zone"
4. Click en "Change repository visibility"
5. Selecciona "Public"
6. Confirma escribiendo el nombre del repo

Nota: tus secretos (FOOTBALL_DATA_TOKEN, GITHUB_TOKEN) están seguros en GitHub Secrets y variables de entorno de Netlify. No están en el código.

### Paso 2: Desactivar auto-deploy en Netlify
1. Ve a https://app.netlify.com → wc26-tracker
2. Site configuration → Build & deploy → Continuous deployment
3. Busca "Build settings"
4. Click en "Stop builds" o desactiva "Auto publishing"

Esto evita que Netlify redeploy cada vez que hay un push. Solo redeployarás manualmente cuando cambies el frontend.

### Paso 3: Hacer un deploy manual (una sola vez)
Después de hacer push con los cambios de código:
1. Ve a Netlify → wc26-tracker → Deploys
2. Click en "Trigger deploy" → "Deploy site"
3. Esto sube la versión del frontend que lee de GitHub raw

### Paso 4: Verificar que funciona
1. Abre tu sitio en el navegador
2. Verifica que carga los datos (grupos, calendario, leaderboard)
3. Si algo falla, el fallback automático lee de `app/data/` (la copia local)

## Cómo queda el flujo después

### Cuando un usuario guarda picks:
1. Netlify Function commitea el pick a `data/picks/` en el repo ✅
2. GitHub Action `publish.yml` detecta el cambio, recalcula leaderboard ✅
3. El leaderboard actualizado queda en `data/leaderboard.json` en el repo ✅
4. El frontend lee el leaderboard fresco de GitHub raw ✅
5. Netlify NO redeploya → 0 créditos ✅

### Cuando hay resultados nuevos (cron 2pm y 10pm México):
1. GitHub Action `refresh-results.yml` consulta la API ✅
2. Actualiza `data/results.json` y recalcula leaderboard ✅
3. El frontend lee los datos frescos de GitHub raw ✅
4. Netlify NO redeploya → 0 créditos ✅

### Cuando cambias el frontend (HTML/CSS/JS):
1. Haces push con los cambios
2. Vas a Netlify → Deploys → Trigger deploy manualmente
3. 1 deploy = 15 créditos (solo cuando tú quieras)

## Consumo estimado de créditos al mes
- Deploys manuales (2-3 al mes): ~45 créditos
- Compute (Netlify Function save-picks): ~5 créditos
- Bandwidth: ~3 créditos
- Total: ~53 créditos/mes (de 300 disponibles)

## Fallback
Si GitHub raw falla por cualquier razón, el frontend automáticamente intenta leer de `app/data/` (los archivos locales de la última vez que hiciste deploy). No se rompe nada.

## Si quieres volver al flujo anterior
1. En `app/app.js`, cambia las URLs de `GH_RAW` de vuelta a `"./data"`
2. Reactiva auto-deploy en Netlify
3. Corre `npm run build` para regenerar `app/data/`
