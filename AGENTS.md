# Notas para agentes — Pac-Man MVP

## Stack y ejecución

- Vanilla JS, HTML y CSS. **No hay build, ni tests, ni package manager.**
- Punto de entrada real: `src/index.html`. Ábrelo directamente en el navegador (p. ej. `start src/index.html` en Windows o cualquier servidor estático local).
- No se usa bundler ni módulos ES. Los archivos en `src/js/` se cargan como scripts clásicos en un orden fijo.

## Convenciones del código

- **Orden de carga obligatorio** en `index.html`:
  1. `js/maze.js` — define `MAZE`, `TUNNEL_ROW`, `PACMAN_START`, `GHOST_STARTS`.
  2. `js/game.js` — define `createGame`, `update`, `DIRS`.
  3. `js/render.js` — define `draw`.
  4. `js/main.js` — inicia el bucle y el teclado.
- La comunicación entre archivos es por **globales en `window`**. Si añades o renombras funciones/constantes compartidas, expónlas y actualiza el consumidor.
- El laberinto es una matriz numérica (`MAZE[y][x]`):
  - `0` vacío transitable, `1` pared, `2` punto, `3` puerta de la guarida.
  - `createGame` copia `MAZE` a `game.grid`; el render y la lógica de comer mutan esa copia, no el original.
- Las velocidades (`PACMAN_SPEED = 0.125`, `GHOST_SPEED = 0.1`) están elegidas para alinear los actores a la rejilla en frames enteros. Si las cambias, revisa `aligned()` y los giros en celdas.
- Coordenadas: celda `(x, y)`, origen arriba-izquierda. El canvas es `560×620` px con `TILE = 20`.

## Flujo de trabajo: Spec Driven Development

- Este repo usa desarrollo dirigido por especificaciones. Las specs van en `specs/NN-slug.md` (la carpeta no existe hasta que se crea la primera).
- Comandos de skill disponibles (definidos en `.agents/skills/`):
  - `/spec <descripción>` — diseña una spec siguiendo el template de `.agents/skills/spec/template.md`.
  - `/spec-impl <NN-slug>` — implementa una spec cuyo estado sea `Approved` / `Aprobado`, creando la rama `spec-NN-slug`.
- El estado de una spec debe pasar a `Approved` (o `Aprobado`) antes de implementar. No asumas que `Draft` está listo.
- `skills-lock.json` registra el origen de los skills (`klerith/fernando-skills`). No lo modifiques salvo que actualices los skills de forma intencionada.

## Verificación

- No hay tests automatizados. La validación es manual: abrir `src/index.html`, revisar la consola del navegador y jugar una partida.
- Antes de entregar un cambio, prueba al menos: inicio, movimiento con flechas, comer puntos, colisión con fantasma, victoria y derrota.
