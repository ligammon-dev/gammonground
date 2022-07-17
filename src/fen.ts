import { pos2key, invRanks } from './util.js';
import * as cg from './types.js';

export const initial: cg.FEN = 'board:somebody:gnubg:1:0:0:0:-2:0:0:0:0:5:0:3:0:0:0:-5:5:0:0:0:-3:0:-5:0:0:0:0:2:0:0:0:1:3:1:1:1:1:0:1:-1:0:25:0:0:0:0:0:0:0:0';

const letters = {
  checker: 'c',
  undo: 'u',
  double: 'd',
  resign1: 'r',
  resign2: 's',
  resign3: 't',
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

export function readCounts(fen: cg.FEN): Array<number> {
  if (fen === 'start') fen = initial;
  var my_string = fen.split(':');

  const counts= new Array();


  // for (let i = 0; i < 12; i++) {
  //   if (i==6) r++;
  //   let count = parseInt(my_string[i+7]);
  //   let count2 = parseInt(my_string[23-i+7]);

  //   r++;
  // }
  for (var i = 0; i < 24; i++) {
      //counts.push(1);
    if (i == 6) {
      counts.push(parseInt(my_string[6]));
    } else if (i == 18) {
      counts.push(parseInt(my_string[31]));
    }
    counts.push(parseInt(my_string[i+7]));

  }
  counts.push(parseInt(my_string[45]));
  counts.push(0-parseInt(my_string[46]));
  counts.push(parseInt(my_string[37]));
  return counts;
}

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
          for (var c = 0; c < Math.min(Math.abs(count), 6); c++) {
            pieces.set(pos2key([r,c]), {role: 'checker', color: count>0 ? 'black' : 'white',});
          }
    }
    if (count2 != 0) {
          for (var c = 0; c < Math.min(Math.abs(count2), 6); c++) {
            pieces.set(pos2key([r,12-c]), {role: 'checker', color: count2>0 ? 'black' : 'white',});
      }
    }
    r++;
  }
  var turn = parseInt(my_string[32]);
  if (parseInt(my_string[33]) > 0) {
    var x = turn > 0 ? 9 : 2
    pieces.set(pos2key([x,6]), {role: dice[my_string[33]], color:  turn > 0 ? 'black' : 'white',});
     //pieces.move(pos2key([x,6]), pos2key([x,8]));
    pieces.set(pos2key([x+1,6]), {role: dice[my_string[34]], color:  turn > 0? 'black' : 'white',});
    if (turn > 0) {
      pieces.set(pos2key([12,6]), {role: 'undo', color: 'black'});
    }
  }

  //var cubeValue = parseInt(my_string[37]);
  var iMayDouble = parseInt(my_string[38]);
  var opponentMayDouble = parseInt(my_string[39]);
  //var wasDoubled = parseInt(my_string[40]);
  if (iMayDouble && opponentMayDouble) { // centered cube
    //pieces.set(pos2key([6,6]), {role: 'double', color:  'black'});
  } else if (iMayDouble) {
    pieces.set(pos2key([6,0]), {role: 'double', color:  'black'});
  } else if (opponentMayDouble) {
    pieces.set(pos2key([6,12]), {role: 'double', color:  'black'});
  }
 
  // draw bar checkers
  if (parseInt(my_string[31]) != 0) {
    pieces.set(pos2key([6,7]), {role: 'checker', color: 'black'});
  }

  if (parseInt(my_string[6]) != 0) {
     pieces.set(pos2key([6,5]), {role: 'checker', color: 'white'});
  }

  // draw off checkers
  if (parseInt(my_string[46]) != 0) {
    pieces.set('a>', {role: 'checker', color: 'white'});
  }

  if (parseInt(my_string[45]) != 0) {
     pieces.set('a0', {role: 'checker', color: 'black'});
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
