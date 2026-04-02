# Inbox de Picks

Coloca aqui los archivos `pick-*.json` exportados desde el frontend.

Luego ejecuta:

```bash
npm run import:picks
```

El importador validara estructura, `submittedAtUtc`, referencias a `matchId` y si el pick fue enviado antes del `lockUtc` del partido.
