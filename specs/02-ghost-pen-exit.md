# SPEC 02 — Salida de los fantasmas de la pen

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-01
> **Objetivo:** Arreglar la salida de los fantasmas de la pen para que, al ser liberados, atraviesen la puerta y se muevan por el mapa en lugar de orbitar eternamente las celdas de la puerta.

## Alcance

**Dentro:**

- `src/js/ghosts.js`: cambiar la regla de salida para que las celdas de la puerta se traten como "todavía dentro" y el objetivo de salida sea la celda situada sobre la puerta.

**Fuera (para futuras specs):**

- `GHOST_STARTS`, retrasos de liberación, `maze.js`, `game.js`, `render.js` e `index.html` — sin cambios.
- Personalidades y targeting greedy fuera de la zona de salida.
- Animación de espera en la pen, modos scatter/frightened.

## Modelo de datos

Antes/después de constantes en `src/js/ghosts.js`:

```js
// Antes
const DOOR_TARGET = { x: 13, y: 12 }; // celda de la puerta

// Después
const DOOR = { x0: 13, x1: 14, y: 12 }; // celdas de la puerta
const DOOR_TARGET = { x: 13, y: 11 }; // salida real: celda sobre la puerta
```

Nueva condición (sustituye el uso de `inPen` en `ghostDecide`):

```js
// Solo se llama con el fantasma alineado a la rejilla (moveGhost aplica Math.round).
function needsExit(g) {
  if (inPen(g)) return true;
  return g.y === DOOR.y && g.x >= DOOR.x0 && g.x <= DOOR.x1;
}
```

- `inPen`, `PEN` y `chooseToward` sin cambios.
- Exportar `window.needsExit` y `window.DOOR`; conservar los exports existentes.
- Sin estado nuevo en `game.ghosts`: la regla es puramente geométrica y aplica también a reentradas.

## Plan de implementación

1. `src/js/ghosts.js`: añadir `DOOR`, cambiar `DOOR_TARGET` a `{ x: 13, y: 11 }`, añadir `needsExit( g )` y usarla en `ghostDecide` en lugar de `inPen`; exportar los símbolos nuevos. El juego sigue funcional y los fantasmas salen en vez de orbitar.
2. Verificar la salida desde cada celda inicial: pinky (13,14), inky (12,14), clyde (15,14), y que blinky (13,11) no resulta afectado (traza en consola o simulación Node de maze.js + game.js + ghosts.js).
3. Verificación manual completa en `src/index.html`: inicio, movimiento con flechas, comer puntos, colisión con fantasma (reset y re-liberación escalonada), victoria y derrota.

## Criterios de aceptación

- [ ] Tras iniciar la partida, pinky, inky y clyde salen de la pen por la puerta y alcanzan la fila 11, cada uno tras su retraso de liberación.
- [ ] Ningún fantasma orbita el circuito de la puerta ((13,12)→(14,12)→(14,13)→(13,13)): desde su liberación hasta la salida pasan menos de ~3 s (~180 frames).
- [ ] Un fantasma ya liberado que reentra en la zona de pen/puerta vuelve a salir por la puerta.
- [ ] blinky conserva su comportamiento y las personalidades de la SPEC 01 no cambian una vez fuera.
- [ ] Tras perder una vida, los fantasmas en la pen vuelven a salir escalonadamente por la puerta.
- [ ] Se sigue pudiendo ganar y perder la partida; sin errores en la consola.
- [ ] El cambio queda confinado a `src/js/ghosts.js` (`git diff --stat`).

## Decisiones

- **Sí:** tratar las celdas de la puerta como parte de la zona de salida y mover `DOOR_TARGET` a (13,11). Causa raíz del bug: en y=12 `inPen()` devolvía false, el targeting greedy tomaba el control y nunca elegía "arriba" (empates resueltos por orden de iteración), produciendo la órbita horaria.
- **Sí:** regla geométrica sin estado por fantasma, aplicable también a reentradas (elección del usuario); auto-corrige órbitas ya iniciadas.
- **Sí:** tocar únicamente `src/js/ghosts.js` (elección del usuario).
- **No:** flag `g.exited` en `createGame`/`resetPositions`: añade estado y toca `game.js` sin beneficio para este caso.
- **No:** mover posiciones iniciales fuera de la pen: rompería el diseño de salida escalonada de la SPEC 01.
- **No:** BFS/pathfinding: ya descartado en la SPEC 01; innecesario con un objetivo correcto.
- **Preservado:** el desempate de `chooseToward` por orden de iteración; ya no genera trampas porque el objetivo está más allá de la puerta.

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                   |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| El greedy produce desvíos menores dentro de la pen (p. ej. clyde se desplaza antes de salir) | La pen no tiene callejones sin salida; sale en <3 s; verificado desde las 3 celdas iniciales |
| Un fantasma que persigue a Pac-Man cruza la puerta y es "empujado" una celda hacia arriba    | Efecto visual menor (1 celda); evita órbitas nuevas dentro de la pen                         |
| `needsExit` evaluado con coordenadas sin alinear                                             | Solo se llama desde `ghostDecide` con el fantasma alineado (`Math.round` en `moveGhost`)     |

## Lo que **no** está en esta spec

- Animación de los fantasmas mientras esperan en la pen.
- Modos scatter/chase globales.
- Power pellets y modo asustado.
- Reentrada de fantasmas comidos (aún no existen).

Cada uno de esos, si llega, va en su propia spec.
