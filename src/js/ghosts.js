// ghosts.js
// Decision de direccion de los fantasmas.

const PEN = { x0: 11, x1: 16, y0: 13, y1: 15 };
const DOOR_TARGET = { x: 13, y: 12 };

function inPen( g ) {
  return g.x >= PEN.x0 && g.x <= PEN.x1 && g.y >= PEN.y0 && g.y <= PEN.y1;
}

function chooseToward( game, g, target ) {
  const grid = game.grid;
  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - target.x ) + Math.abs( ny - target.y );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

function ghostDecide( game, g ) {
  const p = game.pacman;

  if ( inPen( g ) ) {
    g.dir = chooseToward( game, g, DOOR_TARGET );
    return;
  }

  const px = Math.round( p.x );
  const py = Math.round( p.y );
  let target = { x: px, y: py };

  if ( g.kind === 'pinky' ) {
    const d = DIRS[ p.dir ] || { x: 0, y: 0 };
    target = { x: px + d.x * 4, y: py + d.y * 4 };
  }

  g.dir = chooseToward( game, g, target );
}

window.ghostDecide = ghostDecide;
window.chooseToward = chooseToward;
window.inPen = inPen;
window.PEN = PEN;
window.DOOR_TARGET = DOOR_TARGET;
