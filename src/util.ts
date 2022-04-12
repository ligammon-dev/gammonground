import * as cg from './types.js';

export const x = 13;
export const invRanks: readonly cg.Rank[] = [...cg.ranks].reverse();

export const allKeys: readonly cg.Key[] = Array.prototype.concat(...cg.files.map(c => cg.ranks.map(r => c + r)));

export const pos2key = (pos: cg.Pos): cg.Key => allKeys[x * pos[0] + pos[1]];

export const key2pos = (k: cg.Key): cg.Pos => [k.charCodeAt(0) - 97, k.charCodeAt(1) - 49];

export const allPos: readonly cg.Pos[] = allKeys.map(key2pos);

export function memo<A>(f: () => A): cg.Memo<A> {
  let v: A | undefined;
  const ret = (): A => {
    if (v === undefined) v = f();
    return v;
  };
  ret.clear = () => {
    v = undefined;
  };
  return ret;
}

export const timer = (): cg.Timer => {
  let startAt: number | undefined;
  return {
    start() {
      startAt = performance.now();
    },
    cancel() {
      startAt = undefined;
    },
    stop() {
      if (!startAt) return 0;
      const time = performance.now() - startAt;
      startAt = undefined;
      return time;
    },
  };
};

export const opposite = (c: cg.Color): cg.Color => (c === 'white' ? 'black' : 'white');

export const distanceSq = (pos1: cg.Pos, pos2: cg.Pos): number => {
  const dx = pos1[0] - pos2[0],
    dy = pos1[1] - pos2[1];
  return dx * dx + dy * dy;
};

export const samePiece = (p1: cg.Piece, p2: cg.Piece): boolean => p1.role === p2.role && p1.color === p2.color;

export const posToTranslate =
  (bounds: ClientRect): ((pos: cg.Pos, asWhite: boolean) => cg.NumberPair) =>
  (pos, asWhite) =>
    [((asWhite ? pos[0] : x-1 - pos[0]) * bounds.width) / x, ((asWhite ? x-1 - pos[1] : pos[1]) * bounds.height) / x];

export const translate = (el: HTMLElement, pos: cg.NumberPair): void => {
  el.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
};

export const translateAndScale = (el: HTMLElement, pos: cg.NumberPair, scale = 1): void => {
  el.style.transform = `translate(${pos[0]}px,${pos[1]}px) scale(${scale})`;
};

export const setVisible = (el: HTMLElement, v: boolean): void => {
  el.style.visibility = v ? 'visible' : 'hidden';
};

export const eventPosition = (e: cg.MouchEvent): cg.NumberPair | undefined => {
  if (e.clientX || e.clientX === 0) return [e.clientX, e.clientY!];
  if (e.targetTouches?.[0]) return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
  return; // touchend has no position!
};

export const isRightButton = (e: cg.MouchEvent): boolean => e.buttons === 2 || e.button === 2;

export const createEl = (tagName: string, className?: string): HTMLElement => {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  return el;
};

export function computeSquareCenter(key: cg.Key, asWhite: boolean, bounds: ClientRect): cg.NumberPair {
  const pos = key2pos(key);
  if (!asWhite) {
    pos[0] = x-1 - pos[0];
    pos[1] = x-1 - pos[1];
  }
  return [
    bounds.left + (bounds.width * pos[0]) / x + bounds.width / (x*2),
    bounds.top + (bounds.height * (x-1 - pos[1])) / x + bounds.height / (x*2),
  ];
}

// 13x13 Backgammon specific functions


export function isGammonLegal(orig: cg.Key, dest: cg.Key, pieces: cg.Pieces) {
  return (isPip(dest) && !isSamePip(orig, dest) && !isOccupied(orig, dest, pieces));
}


function isPip(key: cg.Key) {
  const pos = key2pos(key);
  return (pos[0] != 6 && pos[1] != 6);
}

// returns true if orig and dest share a triangle
function isSamePip(orig: cg.Key, dest: cg.Key) {
  const pos1 = key2pos(orig);
  const pos2 = key2pos(dest);
  return(
    (pos1[0] == pos2[0]) &&
    (pos1[1] - pos2[1] < 6) && 
    (((pos1[1] / 7) >> 0) - ((pos2[1] / 7) >> 0) == 0)
  );
}

// returns true if dest triangle has 1 or fewer of opponent's pieces
function isOccupied(orig: cg.Key, dest: cg.Key, pieces: cg.Pieces) {
  var count = getCount(dest, pieces);
  return pieces.get(orig)?.color == "black" ? count > 1 : count < -1;
}

// returns number signifying how many checkers on destination
// pip, with numbers less than 0 representing black
// TODO make this in the style of chessground
function getCount(dest: cg.Key, pieces: cg.Pieces) {
  var count = 0;
  const pos = key2pos(dest);
  var nextPos = pos;
  const start = ((pos[1]/7) >> 0)*12;
  const incr = (pos[1]/7 >> 0) ? -1:1
  for (var i = start; i!=6; i+=incr) {
    nextPos[1] = i;
    var p = pieces.get(pos2key(nextPos));
    if (p) {
      if (p.color == "black") {
        count--;
      } else {
        count++;
      }
    }
  }
  return count;
}
