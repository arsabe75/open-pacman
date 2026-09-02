# SPEC 03 — Power pellets y comer fantasmas

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-02
> **Objetivo:** Añadir 4 power pellets al laberinto que, al comerlos, asustan a los fantasmas durante 6 segundos y permiten a Pac-Man comerlos por puntos.

## Alcance

**Dentro:**

- `src/js/maze.js`: nuevo carácter `'o'` → tile `4` (power pellet) en las celdas clásicas (1,3), (26,3), (1,23) y (26,23).
- `src/js/game.js`: constantes `FRIGHTENED_DURATION`, `FRIGHTENED_SPEED`, `GHOST_CHAIN`; estado nuevo en `createGame` (`frightenedUntil`, `ghostChain`, `g.frightened`); comer tile 4 activa el efecto; la colisión con fantasma asustado lo come; `resetPositions` limpia el efecto.
- `src/js/ghosts.js`: `ghostDecide` elige dirección aleatoria (sin dar la vuelta) para fantasmas asustados fuera de la zona de pen.
- `src/js/render.js`: pellets como círculo grande parpadeante; fantasmas asustados azules con cara blanca y parpadeo de aviso al final.

**Fuera (para futuras specs):**

- Ojos que viajan de vuelta a la pen (los fantasmas comidos se teletransportan).
- Popup de puntos al comer un fantasma.
- Sonidos.
- Modos scatter/chase globales y velocidades por personalidad.

## Modelo de datos

```js
// src/js/maze.js
// 'o' → 4 (power pellet); parseTile y comentario de cabecera actualizados.
// Pellets en (1,3), (26,3), (1,23), (26,23) — hoy son dots normales.
```

```js
// Nuevas constantes en src/js/game.js
const FRIGHTENED_DURATION = 360; // frames (~6 s a 60 fps)
const FRIGHTENED_SPEED = 0.05; // 1/20 celda/frame → alinea cada 20 frames
const PELLET_SCORE = 50;
const GHOST_CHAIN = [200, 400, 800, 1600];
```

```js
// createGame añade a game:
{
  frightenedUntil: 0, // game.frame en que termina el efecto; 0 = inactivo
  ghostChain: 0,      // índice de GHOST_CHAIN para el próximo fantasma
}
// Cada fantasma añade:
{
  frightened: false,  // por fantasma: los comidos reaparecen normales
}
// dotsRemaining cuenta tiles 2 y 4; comer un 4 también lo resta.
```

Convenios:

- El efecto se mide con `game.frame` (solo avanza en `state === 'playing'`, igual que `releaseAt`).
- Asustar revierte a cada fantasma: `g.dir = OPPOSITE[ g.dir ]` y `g.speed = FRIGHTENED_SPEED`.
- Fantasma comido: vuelve a su posición de `GHOST_STARTS` según su kind, `frightened = false`, velocidad normal; sale de la pen con la lógica existente (SPEC 02).
- Los fantasmas dentro de la pen también se asustan (se dibujan azules) pero no se pueden comer.

## Plan de implementación

1. `maze.js`: añadir `'o'` → 4 en las 4 celdas y en `parseTile`. `game.js`: contar el tile 4 en `dotsRemaining` y comerlo en `movePacman` (+50 pts, sin efecto aún). `render.js`: `drawPellets` dibuja el tile 4 como círculo grande. Prueba manual: se ven 4 círculos grandes, se comen y se puede ganar/perder.
2. `game.js`: constantes y estado nuevo (`frightenedUntil`, `ghostChain`, `g.frightened`); comer tile 4 activa el efecto (revierte y ralentiza a todos); `update()` lo expira cuando `game.frame >= frightenedUntil`. Prueba manual: al comer un pellet los fantasmas se revierten y van más lentos.
3. `ghosts.js`: `chooseRandom( game, g )` (direcciones sin la opuesta, al azar) y rama asustada en `ghostDecide` después de `needsExit`; exportar el símbolo nuevo. Prueba manual: los fantasmas asustados deambulan sin perseguir.
4. `game.js`: colisión con fantasma asustado lo come (`GHOST_CHAIN[ ghostChain ]` con tope en 1600, `ghostChain++`, teletransporte a la pen); `resetPositions` limpia `frightenedUntil`, `ghostChain` y el estado por fantasma. Prueba manual: se pueden comer fantasmas (200→1600), vuelven a la pen y salen de nuevo; la colisión normal sigue restando vidas.
5. `render.js`: fantasma asustado azul (`#2121de`) con boca en zigzag y ojos blancos; parpadeo azul/blanco en los últimos 120 frames; el pellet parpadea (visible/oculto cada 8 frames). Prueba manual completa: inicio, movimiento, comer puntos y pellets, comer fantasmas, colisión, victoria y derrota.

## Criterios de aceptación

- [ ] `src/index.html` carga sin errores en la consola y se ven 4 power pellets grandes parpadeantes en (1,3), (26,3), (1,23) y (26,23).
- [ ] Comer un pellet suma 50 pts y asusta a todos los fantasmas ~6 s (360 frames): se pintan azules, se revierten y se mueven a 0.05 celdas/frame.
- [ ] Mientras están asustados, los fantasmas eligen dirección al azar en los cruces y nunca dan la vuelta.
- [ ] Los fantasmas dentro de la pen también se pintan azules y siguen saliendo por la puerta con la lógica de la SPEC 02.
- [ ] Tocar un fantasma asustado lo come: suma 200, 400, 800 y 1600 pts en orden dentro del mismo efecto, y el fantasma reaparece en la pen y vuelve a salir.
- [ ] Comer un segundo pellet reinicia el temporizador a 360 frames y la cadena a 200.
- [ ] En los últimos 120 frames del efecto los fantasmas parpadean azul/blanco; al expirar recuperan color, velocidad y personalidad de la SPEC 01.
- [ ] Perder una vida limpia el efecto: `frightenedUntil = 0`, fantasmas normales y cadena reiniciada.
- [ ] La victoria exige comer todos los dots y los 4 pellets; la derrota sigue al perder las 3 vidas.

## Decisiones

- **Sí:** duración de 6 s medida en `game.frame`. Solo avanza durante `'playing'`, igual que `releaseAt` de la SPEC 01.
- **Sí:** efecto global (`frightenedUntil`) con flag por fantasma (`g.frightened`). Necesario porque un fantasma comido reaparece normal aunque el efecto siga activo.
- **Sí:** teletransporte a la pen en vez de ojos que vuelven. Reutiliza la salida de la SPEC 02; los ojos exigirían targeting y reentrada adicionales.
- **Sí:** velocidad asustada 0.05 (1/20 celda/frame). Alinea en frames enteros como exige `aligned()`, a diferencia de valores arbitrarios.
- **Sí:** deambular aleatorio al estar asustado (clásico). **No:** huir de Pac-Man con greedy: predecible y explotable.
- **Sí:** cadena clásica 200/400/800/1600, reiniciada por pellet y al perder vida.
- **Sí:** pellets en posiciones clásicas que cuentan para la victoria (tiles 2 y 4 en `dotsRemaining`).
- **No:** popup de puntos, sonidos y scatter/chase. Amplían alcance; van en otras specs.

## Riesgos

| Riesgo                                                             | Mitigación                                                                                    |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Cambio de velocidad por fantasma rompe la alineación               | 0.05 alinea cada 20 frames; holgura de `aligned()` (1e-3) suficiente                          |
| Revertir dirección a mitad de celda al comer el pellet             | El fantasma recorre hacia atrás el tramo ya recorrido; no puede atravesar muros               |
| Expiración mal implementada revive el flag de fantasmas ya comidos | La expiración recorre los fantasmas y solo normaliza; el comido ya tiene `frightened = false` |
| Fantasma aleatorio oscila entre dos celdas                         | Aceptable (comportamiento clásico); nunca da la vuelta en cruces                              |

## Lo que **no** está en esta spec

- Ojos que viajan a la pen.
- Popup de puntos y sonidos.
- Modos scatter/chase globales.
- Niveles adicionales.

Cada uno de esos, si llega, va en su propia spec.
