import * as fen from './fen.js';
import { AnimCurrent } from './anim.js';
import { DragCurrent } from './drag.js';
import { timer } from './util.js';
import * as cg from './types.js';

export interface HeadlessState {
  pieces: cg.Pieces;
  orientation: cg.Color; // board orientation. white | black
  turnColor: cg.Color; // turn to play. white | black
  lastMove?: cg.Key[]; // squares part of the last move ["c3"; "c4"]
  lastGammonMove?: String[];
  checkerCounts?: number[];
  selected?: cg.Key; // square currently selected "a1"
  viewOnly: boolean; // don't bind events: the user will never be able to move pieces around
  disableContextMenu: boolean; // because who needs a context menu on a chessboard
  addPieceZIndex: boolean; // adds z-index values to pieces (for 3D)
  addDimensionsCssVars: boolean; // add --cg-width and --cg-height CSS vars containing the board's dimensions to the document root
  blockTouchScroll: boolean; // block scrolling via touch dragging on the board, e.g. for coordinate training
  pieceKey: boolean; // add a data-key attribute to piece elements
  highlight: {
    lastMove: boolean; // add last-move class to squares
  };
  animation: {
    enabled: boolean;
    duration: number;
    current?: AnimCurrent;
  };
  movable: {
    free: boolean; // all moves are valid - board editor
    color?: cg.Color | 'both'; // color that can move. white | black | both
    dests?: cg.Dests; // valid moves. {"a2" ["a3" "a4"] "b1" ["a3" "c3"]}
    showDests: boolean; // whether to add the move-dest class on squares
    events: {
      after?: (orig: cg.Key, dest: cg.Key, metadata: cg.MoveMetadata) => void; // called after the move has been played
      afterNewPiece?: (role: cg.Role, key: cg.Key, metadata: cg.MoveMetadata) => void; // called after a new piece is dropped on the board
    };
  };

  draggable: {
    enabled: boolean; // allow moves & premoves to use drag'n drop
    distance: number; // minimum distance to initiate a drag; in pixels
    autoDistance: boolean; // lets chessground set distance to zero when user drags pieces
    showGhost: boolean; // show ghost of piece being dragged
    deleteOnDropOff: boolean; // delete a piece when it is dropped off the board
    current?: DragCurrent;
  };
  dropmode: {
    active: boolean;
    piece?: cg.Piece;
  };
  selectable: {
    // disable to enforce dragging over click-click move
    enabled: boolean;
  };
  stats: {
    // was last piece dragged or clicked?
    // needs default to false for touch
    dragged: boolean;
    ctrlKey?: boolean;
  };
  events: {
    change?: () => void; // called after the situation changes on the board
    // called after a piece has been moved.
    // capturedPiece is undefined or like {color: 'white'; 'role': 'queen'}
    move?: (orig: cg.Key, dest: cg.Key, capturedPiece?: cg.Piece) => void;
    dropNewPiece?: (piece: cg.Piece, key: cg.Key) => void;
    select?: (key: cg.Key) => void; // called when a square is selected
    insert?: (elements: cg.Elements) => void; // when the board DOM has been (re)inserted
  };
  hold: cg.Timer;
}

export interface State extends HeadlessState {
  dom: cg.Dom;
}

export function defaults(): HeadlessState {
  return {
    pieces: fen.read(fen.initial),
    checkerCounts:  fen.readCounts(fen.initial),
    orientation: 'white',
    turnColor: 'white',
    viewOnly: false,
    disableContextMenu: false,
    addPieceZIndex: false,
    addDimensionsCssVars: false,
    blockTouchScroll: false,
    pieceKey: false,
    highlight: {
      lastMove: true,
    },
    animation: {
      enabled: true,
      duration: 200,
    },
    movable: {
      free: true,
      color: 'both',
      showDests: true,
      events: {},
    },
    draggable: {
      enabled: true,
      distance: 3,
      autoDistance: true,
      showGhost: true,
      deleteOnDropOff: false,
    },
    dropmode: {
      active: false,
    },
    selectable: {
      enabled: true,
    },
    stats: {
      // on touchscreen, default to "tap-tap" moves
      // instead of drag
      dragged: !('ontouchstart' in window),
    },
    events: {},
    hold: timer(),
  };
}
