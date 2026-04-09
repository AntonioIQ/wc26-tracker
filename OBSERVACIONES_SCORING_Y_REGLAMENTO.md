# Observaciones de Scoring y Reglamento

Fecha de revisión: 2026-04-08

## 1. Estado actual del proyecto

Hoy la quiniela puntúa así:

- `3 puntos` por marcador exacto.
- `1 punto` por acertar solo el signo del partido: local, visitante o empate.
- `0 puntos` en cualquier otro caso.

Esto sale de:

- `scripts/score.js`
- `scripts/lib/picks.js`

Limitaciones actuales:

- El pick solo guarda `homeScore` y `awayScore`.
- No existe un campo para `clasificado`, `ganador en penales` o `resultado tras prórroga`.
- El script de ingestión usa `score.fullTime` de `football-data.org`.

## 2. Riesgo técnico importante en fase eliminatoria

La documentación oficial de `football-data.org` dice que en partidos que terminan en prórroga o penales hay que distinguir entre:

- `regularTime`: marcador al final de los 90 minutos.
- `extraTime`: goles anotados solo en la prórroga.
- `penalties`: goles anotados solo en la tanda.
- `fullTime`: marcador final del partido, que en algunos casos puede reflejar el total tras prórroga o incluso tras penales según la convención usada por la API.

Consecuencia:

- Si la quiniela sigue leyendo solo `fullTime`, puede mezclar escenarios de 90 minutos, prórroga y penales de una forma poco intuitiva para los usuarios.
- Eso puede generar reclamos porque el jugador puede creer que pronosticó el empate de 90 minutos, pero el sistema podría evaluar otra cosa.

Archivo afectado:

- `scripts/ingest-results.js`

## 3. Regla oficial relevante para el Mundial

Con base en las reglas vigentes de IFAB y en materiales oficiales de FIFA:

- Un partido dura `dos tiempos de 45 minutos`.
- El tiempo añadido (`90+3`, `45+2`, etc.) forma parte del tiempo reglamentario.
- Si una fase eliminatoria sigue empatada tras los 90 minutos, se juegan `dos tiempos extra de 15 minutos`.
- Si sigue empatada tras la prórroga, se define por `penales`.

Inferencia importante:

- `No existe actualmente gol de oro ni gol de plata en las reglas vigentes.`
- FIFA los trata como mecanismos históricos; las reglas actuales aplicables son prórroga completa y, si persiste el empate, penales.

## 4. Qué debe contar como “acierto”

Para evitar discusiones, la quiniela debe definir explícitamente qué está pronosticando el usuario:

Opción A:
- Pronóstico del marcador al final de los `90 minutos` y, en eliminatoria, un campo adicional de `clasificado`.

Opción B:
- Pronóstico del marcador al final de los `120 minutos` y, si aplica, también `ganador en penales`.

Recomendación:

- Usar `Opción A`.

Razones:

- Es la convención más clara para la mayoría de la gente.
- El tiempo añadido sigue contando dentro de los 90, así que no introduce ambigüedad.
- Se separa correctamente `marcador` de `clasificado`.
- Encaja mejor con `regularTime` de la API.
- Evita que una tanda de penales “rompa” la lógica del marcador exacto.

## 5. Política recomendada de puntuación

### Fase de grupos

Evaluar siempre el marcador al final del tiempo reglamentario, incluyendo añadido.

- `3 puntos` por marcador exacto.
- `1 punto` por acertar el signo del partido.
- `0 puntos` si falla ambas cosas.

Casos:

- Si el usuario pone `2-1` y queda `2-1`: `3 puntos`.
- Si pone `2-1` y queda `1-0`: `1 punto`.
- Si pone `1-1` y queda `2-2`: `1 punto`.
- Si pone `1-1` y queda `1-1`: `3 puntos`.

### Fase eliminatoria

Evaluar siempre el marcador al final de los `90 minutos`, incluyendo añadido. Si el partido queda empatado al 90, pedir además el `clasificado`.

Puntos sugeridos:

- `3 puntos` por marcador exacto al 90.
- `1 punto` por acertar el signo al 90.
- `1 punto` adicional por acertar el `clasificado` si el partido llegó empatado al minuto 90 y se resolvió en prórroga o penales.

Nota:

- En eliminatoria, si el partido se define dentro de los 90 minutos, no hace falta campo de clasificado porque el clasificado coincide con el ganador del partido.

## 6. Escenarios y cómo deberían puntuarse

### Escenario 1: partido de grupos decidido en 90 minutos

Ejemplo:

- Pick: `2-0`
- Real: `2-0`
- Resultado: `3 puntos`

Ejemplo:

- Pick: `2-0`
- Real: `1-0`
- Resultado: `1 punto`

### Escenario 2: partido de grupos empatado

Ejemplo:

- Pick: `1-1`
- Real: `0-0`
- Resultado: `1 punto`

Ejemplo:

- Pick: `1-1`
- Real: `1-1`
- Resultado: `3 puntos`

### Escenario 3: eliminatoria decidida en 90 minutos

Ejemplo:

- Pick: `2-1`
- Real al 90: `2-1`
- Resultado: `3 puntos`

Ejemplo:

- Pick: `2-1`
- Real al 90: `1-0`
- Resultado: `1 punto`

### Escenario 4: eliminatoria empatada al 90 y decidida en prórroga

Ejemplo:

- Pick al 90: `1-1`
- Clasificado pronosticado: local
- Real al 90: `1-1`
- Real tras prórroga: gana local `2-1`
- Resultado sugerido: `3 + 1 = 4 puntos`

Ejemplo:

- Pick al 90: `0-0`
- Clasificado pronosticado: visitante
- Real al 90: `1-1`
- Real tras prórroga: gana visitante `1-2`
- Resultado sugerido: `1 + 1 = 2 puntos`

### Escenario 5: eliminatoria empatada al 90 y decidida en penales

Ejemplo:

- Pick al 90: `1-1`
- Clasificado pronosticado: visitante
- Real al 90: `1-1`
- Real tras prórroga: `1-1`
- Real en penales: clasifica visitante
- Resultado sugerido: `3 + 1 = 4 puntos`

Ejemplo:

- Pick al 90: `0-0`
- Clasificado pronosticado: local
- Real al 90: `1-1`
- Real en penales: clasifica local
- Resultado sugerido: `1 + 1 = 2 puntos`

Ejemplo:

- Pick al 90: `2-1`
- Clasificado pronosticado: local
- Real al 90: `1-1`
- Real en penales: clasifica local
- Resultado sugerido: `1 punto` solo por clasificado, si se decide que el clasificado puntúa de forma independiente.

Observación:

- Este último caso debe definirse explícitamente, porque es uno de los que más generan reclamos.

Mi recomendación:

- Que el `clasificado` puntúe de forma independiente con `1 punto` en toda eliminatoria que llegue empatada al 90.

## 7. Qué NO recomendaría

- No usar el marcador tras penales como si fuera marcador futbolístico normal.
- No usar solo `fullTime` sin aclarar su semántica.
- No mezclar en una sola apuesta “marcador exacto” y “clasificado” en partidos de eliminación.
- No evaluar la eliminatoria por marcador al 120 sin dejarlo escrito desde el inicio.

## 8. Casos especiales que conviene dejar escritos en las bases

### Tiempo añadido

- Sí cuenta dentro del resultado de los `90 minutos`.
- Un gol al `90+6` sigue siendo parte del marcador reglamentario.

### Prórroga

- Sí cuenta para definir al clasificado.
- No debe alterar el “marcador exacto al 90” si esa es la convención elegida.

### Penales

- No son goles del partido en sentido normal de quiniela.
- Deben usarse solo para definir el `clasificado`, no el marcador exacto.

### Partido suspendido, aplazado o cancelado

Sugerencia:

- Si no se juega en una ventana razonable definida por las bases, no da puntos hasta que exista resultado oficial.
- Si FIFA adjudica un resultado administrativo, debe definirse si la quiniela lo acepta o si se declara `sin puntuación`.

### Partido “awarded” o resultado administrativo

Sugerencia conservadora:

- Contarlo solo para `clasificado` si afecta una llave.
- No contarlo para marcador exacto salvo que las bases digan expresamente que se respetará el marcador administrativo oficial.

## 9. Recomendación concreta para este proyecto

Si se quiere evitar conflicto con usuarios:

1. Guardar en fase eliminatoria:
   - `homeScore90`
   - `awayScore90`
   - `qualifiedTeam`

2. Ingerir desde la API:
   - `regularTime`
   - `extraTime`
   - `penalties`
   - `winner`
   - `duration`

3. Puntuar así:
   - grupos: exacto o signo al 90
   - eliminatoria: exacto o signo al 90, más punto independiente por clasificado

4. Publicar estas reglas en la UI antes de que la gente capture picks.

## 10. Conclusión

La definición más defendible para una quiniela del Mundial es:

- El `marcador` siempre se evalúa al final de los `90 minutos` reglamentarios, incluyendo añadido.
- En eliminación directa, si hay empate al 90, se pronostica además el `clasificado`.
- La `prórroga` y los `penales` sirven para decidir al clasificado, no para reinterpretar el marcador exacto del partido.

Esa política es la más clara para usuarios, la más fácil de explicar y la menos propensa a reclamos.

## Fuentes consultadas

- IFAB, Law 7: The Duration of the Match  
  https://www.theifab.com/laws/latest/the-duration-of-the-match/

- IFAB, Law 10: Determining the Outcome of a Match  
  https://www.theifab.com/laws/latest/determining-the-outcome-of-a-match/

- FIFA, “73 days to go: When 90 wasn’t enough”  
  https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/extra-time-matches

- football-data.org, “Dealing with scores”  
  https://docs.football-data.org/general/v4/overtime.html
