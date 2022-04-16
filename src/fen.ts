import { pos2key, invRanks } from './util.js';
import * as cg from './types.js';

export const initial: cg.FEN = 'board:somebody:gnubg:1:0:0:0:-2:0:0:0:0:5:0:3:0:0:0:-5:5:0:0:0:-3:0:-5:0:0:0:0:2:0:0:0:1:3:1:1:1:1:0:1:-1:0:25:0:0:0:0:0:0:0:0';

const letters = {
  checker: 'c',
  undo: 'u',
  d1: '1',
  d2: '2',
  d3: '3',
  d4: '4',
  d5: '5',
  d6: '6',
};

const dice: { [letter: string]: cg.Role } = {
  '1': 'd1',
  '2': 'd2',
  '3': 'd3',
  '4': 'd4',
  '5': 'd5',
  '6': 'd6',
};
export function read(fen: cg.FEN): cg.Pieces {
  if (fen === 'start') fen = initial;
  const pieces: cg.Pieces = new Map();
  var my_string = fen.split(':');
  let r=0;
  for (let i = 0; i < 12; i++) {
    if (i==6) r++;
    let count = parseInt(my_string[i+7]);
    let count2 = parseInt(my_string[23-i+7]);
    if (count != 0) {
          for (var c = 0; c < Math.abs(count); c++) {
            pieces.set(pos2key([r,c]), {role: 'checker', color: count>0 ? 'black' : 'white',});
          }
    }
    if (count2 != 0) {
          for (var c = 0; c < Math.abs(count2); c++) {
            pieces.set(pos2key([r,12-c]), {role: 'checker', color: count2>0 ? 'black' : 'white',});
      }
    }
    r++;
  }
  var turn = parseInt(my_string[32]);
  if (parseInt(my_string[33]) > 0) {
    var x = turn > 0 ? 9 : 2
    pieces.set(pos2key([x,6]), {role: dice[my_string[33]], color:  turn > 0 ? 'black' : 'white',});
    pieces.set(pos2key([x+1,6]), {role: dice[my_string[34]], color:  turn > 0? 'black' : 'white',});
  }
  return pieces;
}

// TODO this is still for chess
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
