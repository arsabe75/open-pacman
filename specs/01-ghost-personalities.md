# SPEC 01 — Cuatro fantasmas con personalidades propias

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-08-31
> **Objetivo:** Pasar de 2 a 4 fantasmas con las personalidades clásicas (Blinky perseguidor agresivo, Pinky emboscadora, Inky flanqueador, Clyde huidizo), con salida escalonada de la guarida.

## Alcance

**Dentro:**

- `GHOST_STARTS` (src/js/maze.js) pasa de 2 a 4 fantasmas con kinds clásicos.
- Nuevo archivo `src/js/ghosts.js` con la decisión de dirección por personalidad y la regla de salida de la guarida.
- `game.js`: `createGame` inicializa `game.frame` y `releaseAt` por fantasma; `update()` incrementa el contador; `decideGhost` delega en `ghosts.js`; `moveGhost` no mueve fantasmas aún no liberados.
- `index.html` añade el script de `ghosts.js` entre `game.js` y `render.js`.
- `render.js` reordena `GHOST_COLORS` a los colores clásicos (rojo, rosa, cian, naranja).

**Fuera (para futuras specs):**

- Alternancia scatter/chase con temporizadores globales.
- Modo asustado y power pellets (no existen en el juego actual).
- Velocidades distintas por fantasma.
- Animación de los fantasmas mientras esperan en la guarida.
- Puntos por comer fantasmas, niveles, sonidos.

## Modelo de datos

```js
// src/js/maze.js
const GHOST_STARTS = [
  { x: 13, y: 11, kind: 'blinky' }, // fuera de la pen, sobre la puerta
  { x: 13, y: 14, kind: 'pinky'  }, // dentro de la pen
  { x: 12, y: 14, kind: 'inky'   }, // dentro de la pen
  { x: 15, y: 14, kind: 'clyde'  }, // dentro de la pen
];
```

```js
// Cada fantasma en game.ghosts (createGame)
{
  x, y, dir: 'up', speed: GHOST_SPEED,
  kind: 'blinky',  // 'blinky' | 'pinky' | 'inky' | 'clyde'
  releaseAt: 0,    // game.frame a partir del cual se mueve
}
// createGame añade game.frame = 0.
// Retrasos de liberación: blinky 0, pinky 180, inky 360, clyde 540 (~3 s entre cada uno a 60 fps).
```

```js
// Constantes de src/js/ghosts.js
const PEN = { x0: 11, x1: 16, y0: 13, y1: 15 }; // interior de la guarida
const DOOR_TARGET = { x: 13, y: 12 };           // objetivo mientras está dentro
const CLYDE_CORNER = { x: 1, y: 29 };           // esquina de retirada
const CLYDE_RADIUS = 8;                          // casillas: umbral de huida
```

Objetivos por personalidad (resueltos con el mismo greedy Manhattan del hunter actual):

- **blinky:** celda de Pac-Man.
- **pinky:** celda de Pac-Man + 4 × dirección de Pac-Man.
- **inky:** pivote = Pac-Man + 2 × dirección; objetivo = 2 × pivote − posición de blinky.
- **clyde:** si distancia euclídea a Pac-Man ≥ 8 → Pac-Man; si < 8 → `CLYDE_CORNER`.

Convenio: mientras un fantasma esté dentro de `PEN`, su objetivo es `DOOR_TARGET` (garantiza la salida sin BFS).

## Plan de implementación

1. Crear `src/js/ghosts.js` con esqueleto: `ghostDecide(game, g)` que reproduce el comportamiento actual (hunter/random). Añadir el `<script>` en `index.html` entre `game.js` y `render.js`. `decideGhost` (game.js) delega en `window.ghostDecide`. El juego sigue igual.
2. `maze.js`: `GHOST_STARTS` con los 4 fantasmas. `createGame` (game.js) copia `kind` y añade `releaseAt` y `game.frame = 0`. Prueba manual: se ven 4 fantasmas con colores distintos y se mueven.
3. `game.js`: `update()` hace `game.frame++`; `moveGhost` retorna sin mover si `game.frame < g.releaseAt`. Prueba manual: pinky/inky/clyde permanecen quietos en la pen hasta su turno.
4. `ghosts.js`: extraer la selección greedy hacia un objetivo (`chooseToward`) y aplicar la regla de `PEN`/`DOOR_TARGET`. Prueba manual: los fantasmas liberados salen de la pen sin dar vueltas.
5. `ghosts.js`: personalidades blinky (persecución directa) y pinky (4 casillas por delante). Prueba manual: blinky persigue de forma agresiva; pinky corta camino por delante.
6. `ghosts.js`: personalidades inky (flanco vía blinky) y clyde (huida a su esquina si está cerca). Eliminar el código provisional random/hunter. Prueba manual: los 4 comportamientos son distinguibles en una partida.
7. `render.js`: reordenar `GHOST_COLORS` a `['#ff0000', '#ffb8ff', '#00ffff', '#ffb852']` para que cada kind tenga su color clásico por índice. Prueba manual completa: inicio, movimiento, comer puntos, colisión, victoria y derrota.

## Criterios de aceptación

- [ ] `src/index.html` carga sin errores en la consola y se ven 4 fantasmas: rojo (blinky), rosa (pinky), cian (inky), naranja (clyde).
- [ ] Al iniciar, solo blinky está activo; pinky sale ~3 s después, inky ~6 s y clyde ~9 s.
- [ ] blinky se dirige hacia Pac-Man en cada cruce (persecución agresiva, comportamiento greedy).
- [ ] pinky apunta por delante de la trayectoria de Pac-Man (no lo sigue por detrás).
- [ ] inky cambia su ruta según la posición de blinky.
- [ ] clyde persigue a Pac-Man cuando está lejos y se retira hacia la esquina inferior izquierda cuando está a menos de 8 casillas.
- [ ] Ningún fantasma da la vuelta en un cruce salvo en callejones sin salida.
- [ ] Tras chocar con un fantasma se resta una vida, los 4 vuelven a sus posiciones iniciales y los que están en la pen vuelven a salir escalonadamente por la puerta.
- [ ] Comer todos los puntos sigue ganando la partida y perder las 3 vidas sigue perdiéndola.
- [ ] Los kinds `hunter` y `random` ya no existen en el código.

## Decisiones

- **Sí:** personalidades clásicas. Están bien definidas, son distinguibles y fue la opción elegida.
- **Sí:** greedy Manhattan para los cuatro. Ya está probado con el hunter actual; **no** BFS, por complejidad innecesaria en el MVP.
- **Sí:** salida escalonada por `releaseAt` (0/180/360/540 frames). Los temporizadores solo avanzan durante `state === 'playing'`.
- **Sí:** objetivo-puerta dentro de la pen, porque sin BFS el greedy puede orbitar el perímetro sin encontrar la salida.
- **Sí:** archivo nuevo `src/js/ghosts.js` (elección del usuario), cargado entre `game.js` y `render.js`.
- **Sí:** fantasmas no liberados permanecen quietos (sin animación de rebote). Simplifica el MVP.
- **No:** comportamiento `random`. Las 4 personalidades lo sustituyen.
- **No:** modos scatter/frightened. Amplían alcance; los power pellets ni existen todavía.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Greedy dentro de la pen orbita sin encontrar la puerta | Objetivo forzado `DOOR_TARGET` dentro de `PEN`; verificado a mano desde las 4 celdas de inicio |
| inky depende de la posición de blinky | `ghostDecide` localiza a blinky por kind; si no existe, usa persecución directa |
| Los retrasos asumen ~60 fps | Están en frames; si el bucle cambia, se ajustan las constantes |

## Lo que **no** está en esta spec

- Power pellets y modo asustado.
- Temporizadores globales de scatter.
- Velocidades por fantasma.
- Comer fantasmas ni cadenas de puntos.
- Reentrada a la pen de fantasmas comidos.

Cada uno de esos, si llega, va en su propia spec.
