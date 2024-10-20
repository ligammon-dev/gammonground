import { HeadlessState } from './state.js';
import { samePiece, key2pos, pos2key, opposite, distanceSq, allPos, computeSquareCenter, x, isGammonLegal, isSamePip, square2pip} from './util.js';
import * as cg from './types.js';

export function callUserFunction<T extends (...args: any[]) => void>(f: T | undefined, ...args: Parameters<T>): void {
  if (f) setTimeout(() => f(...args), 1);
}

export function toggleOrientation(state: HeadlessState): void {
  state.orientation = opposite(state.orientation);
  state.animation.current = state.draggable.current = state.selected = undefined;
}

export function reset(state: HeadlessState): void {
  state.lastMove = undefined;
  state.lastGammonMove = undefined;
  unselect(state);
}

export function setPieces(state: HeadlessState, pieces: cg.PiecesDiff): void {
  for (const [key, piece] of pieces) {
    if (piece) state.pieces.set(key, piece);
    else state.pieces.delete(key);
  }
}

export function baseMove(state: HeadlessState, orig: cg.Key, dest: cg.Key): cg.Piece | boolean {
  const origPiece = state.pieces.get(orig),
    destPiece = state.pieces.get(dest);
  if (orig === dest || !origPiece) return false;
  const captured = destPiece && destPiece.color !== origPiece.color ? destPiece : undefined;
  //const captured = destPiece;
  if (dest === state.selected) unselect(state);


  callUserFunction(state.events.move, orig, dest, captured);
  //if (!tryAutoCastle(state, orig, dest)) {
    state.pieces.set(dest, origPiece);
    state.pieces.delete(orig);
  //}

  // don't register slid checkers
  if (!isSamePip(orig, dest)) {
    state.lastMove = [orig, dest];
    if (orig.charAt(0) === 'g' ) {
        state.lastGammonMove?.push('25/' + square2pip(dest));
    } else if (dest === 'a0') {
      state.lastGammonMove?.push(square2pip(orig) + '/0');
    } else {
      state.lastGammonMove?.push(square2pip(orig) + '/' + square2pip(dest));
    }
  }
  //state.lastMove = [orig, dest];

  callUserFunction(state.events.change);
  return captured || true;
}

export function baseNewPiece(state: HeadlessState, piece: cg.Piece, key: cg.Key, force?: boolean): boolean {
  if (state.pieces.has(key)) {
    if (force) state.pieces.delete(key);
    else return false;
  }
  callUserFunction(state.events.dropNewPiece, piece, key);
  state.pieces.set(key, piece);
  state.lastMove = [key];
  //state.lastGammonMove = [];
  callUserFunction(state.events.change);
  state.movable.dests = undefined;


  //state.turnColor = opposite(state.e);
  return true;
}

function baseUserMove(state: HeadlessState, orig: cg.Key, dest: cg.Key): cg.Piece | boolean {
  const result = baseMove(state, orig, dest);
   
  if (result) {
    state.movable.dests = undefined; 
    //state.turnColor = opposite(state.turnColor);
    state.animation.current = undefined;
  }

  return result;
}

export function userMove(state: HeadlessState, orig: cg.Key, dest: cg.Key): boolean {
  if (canMove(state, orig, dest)) {

    let result;

    // Gammonground
    const clr = state.pieces.get(orig)?.color;
    const isSame = state.pieces.get(orig)?.color === state.pieces.get(dest)?.color;
    const pos1 = key2pos(orig);
    const pos2 = key2pos(dest);
    const incr1 = pos1[1] > 6 ? -1:1;
    const incr2 = pos2[1] > 6 ? -1:1;
    var k = pos2[1];
    var i = pos1[1]+incr1;
    if (dest === 'a0' || dest === 'a>') {
       result = baseUserMove(state, orig, dest);
     } else {
      if (isSame) {
        // slide checkers dest up
        for (k = pos2[1]; (k+incr2) !== 6 && state.pieces.get(pos2key([pos2[0],k+incr2])); k+=incr2) ;
        if (k+incr2 === 6) {
          // original move
          //console.log(state.dom);
          //setText(state.pieces.get(dest));
          //if (state.checkerCounts)
            //state.checkerCounts[square2pip(pos2key(pos2))] += 1;
          result = baseUserMove(state, orig, dest);
        } else {
          result = baseUserMove(state, orig, pos2key([pos2[0], k+incr2]));
        }
      } else {
        // The original move
        result = baseUserMove(state, orig, dest);
      }
    }

    if (result) {
      const holdTime = state.hold.stop();
      unselect(state);
      const metadata: cg.MoveMetadata = {
        ctrlKey: state.stats.ctrlKey,
        holdTime,
      };
      if (result !== true) {
        metadata.captured = result;
      }
      callUserFunction(state.movable.events.after, orig, dest, metadata);


      // TODO grab checkers from top orig 
      for (var ii = pos1[1]+incr1; ii !== 6 && state.pieces.get(pos2key([pos1[0],ii])); ii+=incr1) {
          baseUserMove(state, pos2key([pos1[0],ii]), pos2key([pos1[0], ii-incr1]));
      }

      if (dest === 'a0' || dest === 'a>') {
        if (state.checkerCounts) {
          const inc = clr == 'white' ? -1:1;
          let p1 = square2pip(pos2key(pos1))-1;

          if (dest == 'a0') {
            state.checkerCounts[26] += inc;
          } else {
            state.checkerCounts[27] += inc;
          }
          state.checkerCounts[p1+(p1/6>>0)-(p1/12>>0)] -= inc;
          if (Math.abs(state.checkerCounts[p1+(p1/6>>0)-(p1/12>>0)]) > 5) {
              state.pieces.set(pos2key([pos1[0],i-incr1]), {role: 'checker', color: inc<0 ? 'white' : 'black',})
          }
        }
        return true;
      }

      // TODO slide successive checkers down to destination to fill gap
      var p2 = state.pieces.get(dest);
      for (var j = pos2[1]; j!=((pos2[1]/7) >> 0)*12; j-=incr2) {
        var p = state.pieces.get(pos2key([pos2[0], j-incr2]));
        if (p && p2 && samePiece(p,p2)) {
          break;
        }
      }
      baseUserMove(state, dest, pos2key([pos2[0], j]));

      state.lastMove = [pos2key([pos1[0],i-incr1]), isSame ? pos2key([pos2[0], k+incr2==6?k:k+incr2]) :  pos2key([pos2[0], j])];

      if (state.checkerCounts) {

        let p1 = square2pip(pos2key(pos1))-1;
        let p2 = square2pip(pos2key(pos2))-1;
        let inc = clr == 'white' ? -1:1;

        state.checkerCounts[p2+(p2/6>>0)-(p2/12>>0)] += inc;
        // if captured
        if ( state.checkerCounts[p2+(p2/6>>0)-(p2/12>>0)] == 0) {
          state.pieces.set(pos2key([6, inc>0 ? 5:7]),  {role: 'checker', color: inc>0 ? 'white' : 'black',});
          state.checkerCounts[inc>0 ? 6:19] -= inc;
          state.checkerCounts[p2+(p2/6>>0)-(p2/12>>0)] = inc;
        }
        if (pos1[0] == 6) { // if origin is on bar
          state.checkerCounts[inc>0 ? 19:6] -= inc;
          if (Math.abs(state.checkerCounts[inc>0 ? 19:6]) > 0) {
              state.pieces.set(pos2key([6, inc<0 ? 5:7]),  {role: 'checker', color: inc<0 ? 'white' : 'black',});
          }
        } else {

          state.checkerCounts[p1+(p1/6>>0)-(p1/12>>0)] -= inc;
          if (Math.abs(state.checkerCounts[p1+(p1/6>>0)-(p1/12>>0)]) > 5) {
              state.pieces.set(pos2key([pos1[0],i-incr1]), {role: 'checker', color: inc<0 ? 'white' : 'black',})
          }
        }
      }
      return true;
    }
  } else {
    //console.log("not legal")
  }
  unselect(state);
  return false;
}

export function dropNewPiece(state: HeadlessState, orig: cg.Key, dest: cg.Key, force?: boolean): void {
  const piece = state.pieces.get(orig);
  if (piece && (canDrop(state, orig, dest) || force)) {
    state.pieces.delete(orig);
    baseNewPiece(state, piece, dest, force);
    callUserFunction(state.movable.events.afterNewPiece, piece.role, dest, {

    });
  } 
  state.pieces.delete(orig);
  unselect(state);
}

export function selectSquare(state: HeadlessState, key: cg.Key, force?: boolean): void {
  callUserFunction(state.events.select, key);
  if (state.selected) {
    if (state.selected === key && !state.draggable.enabled) {
      unselect(state);
      state.hold.cancel();
      return;
    } else if ((state.selectable.enabled || force) && state.selected !== key) {
      if (userMove(state, state.selected, key)) {
        state.stats.dragged = false;
        return;
      }
    }
  }
  if (isMovable(state, key)) {
    setSelected(state, key);
    state.hold.start();
  }
}

export function setSelected(state: HeadlessState, key: cg.Key): void {
  state.selected = key;
}

export function unselect(state: HeadlessState): void {
  state.selected = undefined;
  state.hold.cancel();
}

function isMovable(state: HeadlessState, orig: cg.Key): boolean {
  const piece = state.pieces.get(orig);
  return (
    !!piece &&
    piece.role == 'checker' &&
    (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color))
  );
}

export function canMove(state: HeadlessState, orig: cg.Key, dest: cg.Key): boolean {
  return (
    orig !== dest && isMovable(state, orig) && (state.movable.color == 'white' || state.movable.free || !!state.movable.dests?.get(orig)?.includes(dest) || dest == 'a0') && (isGammonLegal(orig, dest, state.pieces) || dest == 'a0' || dest == 'a>')
  );
}

function canDrop(state: HeadlessState, orig: cg.Key, dest: cg.Key): boolean {
  const piece = state.pieces.get(orig);
  return (
    !!piece &&
    (orig === dest || !state.pieces.has(dest)) &&
    (state.movable.color === 'both' || (state.movable.color === piece.color && state.turnColor === piece.color))
  );
}

export function isDraggable(state: HeadlessState, orig: cg.Key): boolean {
  const piece = state.pieces.get(orig);
  return (
    !!piece &&
    state.draggable.enabled &&
    (state.movable.color === 'both' ) || (state.movable.color === piece?.color)// && (state.turnColor === piece.color || state.premovable.enabled)))
  );
}

export function cancelMove(state: HeadlessState): void {
  unselect(state);
}

export function stop(state: HeadlessState): void {
  state.movable.color = state.movable.dests = state.animation.current = undefined;
  cancelMove(state);
}

export function getKeyAtDomPos(pos: cg.NumberPair, asWhite: boolean, bounds: ClientRect): cg.Key | undefined {
  let file = Math.floor((x * (pos[0] - bounds.left)) / bounds.width);
  if (!asWhite) file = x-1 - file;
  let rank = x-1 - Math.floor((x * (pos[1] - bounds.top)) / bounds.height);
  if (!asWhite) rank = x-1 - rank;
  return file >= 0 && file < x && rank >= 0 && rank < x ? pos2key([file, rank]) : undefined;
}

export function getSnappedKeyAtDomPos(
  //orig: cg.Key,
  pos: cg.NumberPair,
  asWhite: boolean,
  bounds: ClientRect
): cg.Key | undefined {
  //const origPos = key2pos(orig);
  //const validSnapPos = allPos.filter(pos2 => {
  //  return queen(origPos[0], origPos[1], pos2[0], pos2[1]) || knight(origPos[0], origPos[1], pos2[0], pos2[1]);
  //});
  const validSnapPos = allPos;
  const validSnapCenters = validSnapPos.map(pos2 => computeSquareCenter(pos2key(pos2), asWhite, bounds));
  const validSnapDistances = validSnapCenters.map(pos2 => distanceSq(pos, pos2));
  const [, closestSnapIndex] = validSnapDistances.reduce(
    (a, b, index) => (a[0] < b ? a : [b, index]),
    [validSnapDistances[0], 0]
  );
  return pos2key(validSnapPos[closestSnapIndex]);
}

export function whitePov(s: HeadlessState): boolean {
  return s.orientation === 'white';
}
