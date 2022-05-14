import { HeadlessState } from './state.js';
import { setVisible, createEl } from './util.js';
import { colors, Elements} from './types.js'
import * as cg from './types.js';

//import { createElement as createSVG, setAttributes } from './svg.js';

export function createElement(tagName: string): SVGElement {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}
export function setAttributes(el: SVGElement, attrs: { [key: string]: any }): SVGElement {
  for (const key in attrs) el.setAttribute(key, attrs[key]);
  return el;
}
function pos2user(pos: cg.Pos, bounds: ClientRect): cg.NumberPair {
  const xScale = Math.min(1, bounds.width / bounds.height);
  const yScale = Math.min(1, bounds.height / bounds.width);
  return [(pos[0] - 3.5) * xScale, (3.5 - pos[1]) * yScale];
}
export function renderSvg(pos: cg.Pos, customSvg: string, bounds: ClientRect): SVGElement {
//function renderSvg(customSvg: string, pos: cg.Pos, bounds: ClientRect): SVGElement {

  const [x, y] = pos2user(pos, bounds);

  // Translate to top-left of `orig` square
  const g = setAttributes(createElement('g'), { transform: `translate(${x},${y})` });

  // Give 100x100 coordinate system to the user for `orig` square
  const svg = setAttributes(createElement('svg'), { width: 1, height: 1, viewBox: '0 0 100 100' });

  g.appendChild(svg);
  svg.innerHTML = customSvg;
  return g;
}
export function renderWrap(element: HTMLElement, s: HeadlessState): Elements {
  // .cg-wrap (element passed to Chessground)
  //   cg-container
  //     cg-board
  //     svg.cg-shapes
  //       defs
  //       g
  //     svg.cg-custom-svgs
  //       g
  //     cg-auto-pieces
  //     coords.ranks
  //     coords.files
  //     piece.ghost

  element.innerHTML = '';

  // ensure the cg-wrap class is set
  // so bounds calculation can use the CSS width/height values
  // add that class yourself to the element before calling chessground
  // for a slight performance improvement! (avoids recomputing style)
  element.classList.add('cg-wrap');

  for (const c of colors) element.classList.toggle('orientation-' + c, s.orientation === c);
  element.classList.toggle('manipulable', !s.viewOnly);

  const container = createEl('cg-container');
  element.appendChild(container);

  const board = createEl('cg-board');
  container.appendChild(board);

  let customSvg: SVGElement | undefined;

  customSvg = setAttributes(createElement('svg'), {
    class: 'cg-custom-svgs',
    viewBox: '-3.5 -3.5 13 13',
    preserveAspectRatio: 'xMidYMid slice',
  });
  //s.checkerCounts?.push(0);
  customSvg.appendChild(createElement('g'));
  //s.checkerCounts = new Array(0);
  container.appendChild(customSvg);



  for (var i = 0; i < 26; i++) {

  //customSvg.appendChild(renderSvg([i>12?12-(i%13):i%13,i>12?2:0], makeCheckerCount(i), board.getBoundingClientRect()));
  customSvg.appendChild(renderSvg([i>12?12-(i%13):i%13,i>12?2:0], '', board.getBoundingClientRect()));


  }
  customSvg.appendChild(renderSvg([0,-6], '', board.getBoundingClientRect()));
  customSvg.appendChild(renderSvg([0,8], '', board.getBoundingClientRect()));
  customSvg.appendChild(renderSvg([6,1], '64', board.getBoundingClientRect()));

  

  let ghost: HTMLElement | undefined;
  if (s.draggable.showGhost) {
    ghost = createEl('piece', 'ghost');
    setVisible(ghost, false);
    container.appendChild(ghost);
  }

  return {
    board,
    container,
    wrap: element,
    ghost,
    customSvg
  };
}


//  function makeCheckerCount(count: number): string {
//   return '<style> .heavy { font:  50px arial; fill: red; } </style> <text x="45" y="60" class="heavy">' + count + '</text>';
// }