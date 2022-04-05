import { pos2key, invRanks } from './util.js';
import * as cg from './types.js';
// export const initial: cg.FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
//export const initial: cg.FEN = 'pp1p1p1p/pp3p1p/pp5p/7p/8/PP6/PPP1P1PP/PPP1P1PP w - - 0 1';



export const initial: cg.FEN = 'somebody:gnubg:1:0:0:0:-2:0:0:0:0:5:0:3:0:0:0:-5:5:0:0:0:-3:0:-5:0:0:0:0:2:0:1:3:1:3:1:1:1:1:0:1:-1:0:25:0:0:0:0:0:0:0:0';
// const roles: { [letter: string]: cg.Role } = {
//   p: 'pawn',
//   r: 'rook',
//   n: 'knight',
//   b: 'bishop',
//   q: 'queen',
//   k: 'king',
// };

const letters = {
  pawn: 'p',
  rook: 'r',
  knight: 'n',
  bishop: 'b',
  queen: 'q',
  king: 'k',
};

export function read(fen: cg.FEN): cg.Pieces {
  if (fen === 'start') fen = initial;
  const pieces: cg.Pieces = new Map();
  var my_string = fen.split(':');
  let r=0;
  for (let i = 0; i < 12; i++) {
    if (i==6) r++;
    let count = parseInt(my_string[i+6]);
    let count2 = parseInt(my_string[23-i+6])
    if (count != 0) {
          for (var c = 0; c < Math.abs(count); c++) {
            pieces.set(pos2key([r,12-c]), {role: 'pawn', color: count>0 ? 'black' : 'white',});
          }
    }
    if (count2 != 0) {
          for (var c = 0; c < Math.abs(count2); c++) {
            pieces.set(pos2key([r,c]), {role: 'pawn', color: count2>0 ? 'black' : 'white',});
      }
    }
    r++;
  }
  //pieces.set(pos2key([col,row]), {role: 'pawn', color: 'black' ,});
  // for (const c of fen) {
  //   switch (c) {
  //     case ' ':
  //     case '[':
  //       return pieces;
  //     // case '/':
  //     //   --row;
  //     //   if (row < 0) return pieces;
  //     //   col = 0;
  //     //   break;
  //     // case '~': {
  //     //   const piece = pieces.get(pos2key([col - 1, row]));
  //     //   if (piece) piece.promoted = true;
  //     //   break;
  //     // }
  //     // default: {
  //     //   const nb = c.charCodeAt(0);
  //     //   if (nb < 57) col += nb - 48;
  //     //   else {
  //     //     const role = c.toLowerCase();
  //     //     pieces.set(pos2key([col, row]), {
  //     //       role: roles[role],
  //     //       color: c === role ? 'black' : 'white',
  //     //     });
  //     //     ++col;
  //     //   }
  //     // }
  //   }
  // }
  return pieces;
}

export function write(pieces: cg.Pieces): cg.FEN {
  return invRanks
    .map(y =>
      cg.files
        .map(x => {
          const piece = pieces.get((x + y) as cg.Key);
          if (piece) {
            let p = letters[piece.role];
            if (piece.color === 'white') p = p.toUpperCase();
            if (piece.promoted) p += '~';
            return p;
          } else return '1';
        })
        .join('')
    )
    .join('/')
    .replace(/1{2,}/g, s => s.length.toString());
}
