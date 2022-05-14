import { Api, start } from './api.js';
import { Config, configure } from './config.js';
import { HeadlessState, State, defaults } from './state.js';

import { renderWrap } from './wrap.js';
import * as events from './events.js';
import { render, renderResized, updateBounds } from './render.js';
import * as util from './util.js';
import * as cg from './types.js';

export function Gammonground(element: HTMLElement, config?: Config): Api {
  const maybeState: State | HeadlessState = defaults();

  configure(maybeState, config || {});

  function redrawAll(): State {
    const prevUnbind = 'dom' in maybeState ? maybeState.dom.unbind : undefined;
    // compute bounds from existing board element if possible
    // this allows non-square boards from CSS to be handled (for 3D)
    const elements = renderWrap(element, maybeState),
      bounds = util.memo(() => elements.board.getBoundingClientRect()),
      redrawNow = (): void => {
        render(state);
        renderCheckerCount(state,  elements.customSvg!);

      },
      onResize = (): void => {
        updateBounds(state);
        renderResized(state);
      };
    const state = maybeState as State;
    state.dom = {
      elements,
      bounds,
      redraw: debounceRedraw(redrawNow),
      redrawNow,
      unbind: prevUnbind,
    };
    updateBounds(state);
    redrawNow();
    events.bindBoard(state, onResize);
    if (!prevUnbind) state.dom.unbind = events.bindDocument(state, onResize);
    state.events.insert && state.events.insert(elements);
    return state;
  }

  return start(redrawAll(), redrawAll);
}

function debounceRedraw(redrawNow: (skipSvg?: boolean) => void): () => void {
  let redrawing = false;
  return () => {
    if (redrawing) return;
    redrawing = true;
    requestAnimationFrame(() => {
      redrawNow();
      redrawing = false;
    });
  };
}

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

export function renderCheckerCount(state: State, customSvg: SVGElement): void {
  //console.log(customSvgsEl.viewportElement?.children[1], bounds);
   if (state.checkerCounts) {
  for (var i = 0; i < 26; i++) {
       if (Math.abs(state.checkerCounts[i]) > 6 || 
         (Math.abs(state.checkerCounts[i]) > 1 && (i==6 || i == 19)))
         {
        customSvg.replaceChild(renderSvg([i>12?12-(i%13):i%13,i>12?2:0], makeCheckerCount(state.checkerCounts[i]), state.dom.bounds()), customSvg.children[i+1] );
      //customSvg.replaceChild(renderSvg([i,0], makeCheckerCount(state.checkerCounts[i]), state.dom.bounds()), customSvg.children[i] );
      //customSvg.children[i].innerHTML = makeCheckerCount(state.checkerCounts[i]);
       } else {
         customSvg.children[i+1].innerHTML = '';
       }
    }
    // off checkers
    if (Math.abs(state.checkerCounts[26]) > 1) {
          customSvg.replaceChild(renderSvg([0,-6], makeCheckerCount(state.checkerCounts[26]), state.dom.bounds()), customSvg.children[27] );
    } else {
      customSvg.children[27].innerHTML = '';
    }

    if (Math.abs(state.checkerCounts[27]) > 1) {
          customSvg.replaceChild(renderSvg([0,8], makeCheckerCount(state.checkerCounts[27]), state.dom.bounds()), customSvg.children[28] );
    } else {
      customSvg.children[28].innerHTML = '';
    }
    // cube
  if (state.checkerCounts[28] > 1) {
   // var pos = [6,1];
    //console.log(state.pieces.get('g7'));
    if (state.pieces.get('f7')){
      customSvg.replaceChild(renderSvg([5,1], makeDoublingCube(state.checkerCounts[28]), state.dom.bounds()), customSvg.children[29]);
    } else if (state.pieces.get('h7')) {
       customSvg.replaceChild(renderSvg([7,1], makeDoublingCube(state.checkerCounts[28]), state.dom.bounds()), customSvg.children[29]);
    } else if (state.pieces.get('g=')) {
       customSvg.replaceChild(renderSvg([6,7], makeDoublingCube(state.checkerCounts[28]), state.dom.bounds()), customSvg.children[29]);
    } else if (state.pieces.get('g1')) {
       customSvg.replaceChild(renderSvg([6,-5], makeDoublingCube(state.checkerCounts[28]), state.dom.bounds()), customSvg.children[29]);
    }
  } else {
    customSvg.children[29].innerHTML = '';
  }
 
}
  
    //console.log(state.checkerCounts, customSvg);

}

function makeCheckerCount(count: number): string {
  const c =  (count < 0) ? 'black' : 'white';
  //console.log("numb", count, c);
  return '<style> .white { font:  50px arial; fill: white; }  .black { font:  50px arial; fill: black; } </style> <text x="50" y="58" class="'+c+'">' + Math.abs(count) + '</text>';
}

function makeDoublingCube(count: number): string {
  //const c =  (count < 0) ? 'black' : 'white';
  //console.log("numb", count, c);
  return '<style> .white { font:  50px arial; fill: white; }  .black { font:  50px courier; fill: black; } </style> <text x="50" y="58" class="black">' + count + '</text>';
}