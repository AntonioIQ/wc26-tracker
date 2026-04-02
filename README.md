# Quiniela Mundial

Scaffold inicial para una quiniela del Mundial con costo operativo cero.

## Principios
- Sitio estatico en GitHub Pages.
- Repo como fuente de verdad.
- Datos versionados en JSON.
- Automatizacion opcional, no critica.
- Fallback manual siempre disponible.

## Estructura
- `app/`: frontend estatico.
- `data/`: datos del torneo, picks y tabla.
- `scripts/`: validacion, scoring e ingestiones.
- `.github/workflows/`: publicacion y tareas programadas.

## Flujo base
1. Cargar o actualizar `matches.json`.
2. Importar picks a `data/picks/`.
3. Actualizar `results.json`.
4. Correr validacion y scoring.
5. Publicar `app/` + datos generados.

## Estado actual
Ya existe una primera version del frontend que consume `app/data/*.json` y muestra calendario, resultados y tabla.

## Comandos
- `npm run validate`: valida consistencia basica de datos.
- `npm run score`: recalcula `data/leaderboard.json`.
- `npm run import:picks`: importa archivos desde `inbox/picks/` hacia `data/picks/`.
- `npm run build`: valida, recalcula tabla y copia `data/` a `app/data/` para publicar en GitHub Pages.
- `npm run serve`: levanta un servidor estatico local sobre `app/`.

## Flujo offline de picks
1. Ejecutar `npm run build`.
2. Ejecutar `npm run serve`.
3. Abrir `http://localhost:4173`.
2. Capturar alias, nombre visible y marcadores en la seccion "Tu quiniela".
3. Guardar borrador localmente en el navegador.
4. Exportar el archivo `JSON`.
5. Importar ese archivo despues al repositorio con el flujo administrativo.

## Flujo administrativo de importacion
1. Colocar archivos exportados en `inbox/picks/`.
2. Ejecutar `npm run import:picks`.
3. Ejecutar `npm run build`.
4. Revisar `data/picks/` y `data/leaderboard.json`.
