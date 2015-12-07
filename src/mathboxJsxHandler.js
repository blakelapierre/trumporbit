import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './debounce';
import unindent from './unindent';
import scriptHandler from './scriptHandler';

const timeToUpdate = 1000; // In milliseconds

let boxes = [];

scriptHandler('mathbox/jsx', (text, script) => {
  const {view, result, root} = handleMathBoxJsx(unindent(text), script.parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  window.mathboxes = boxes;

  build(view, root);

  (onMathBoxViewBuilt || attachControls)(view, controls, commands);
});

function handleMathBoxJsx(code, parentNode) { //get rid of parentNode
  const {result, root} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins} = result,
        element = attachTo || parentNode;

  const view = mathBox({
    element,
    plugins: plugins || ['core', 'cursor'],
    controls: {
      klass: cameraControls || THREE.OrbitControls
    },
  });

  if (editorPanel) attachPanel(element, root);

  console.log(root);

  return {view, result, root};

  function runMathBoxJsx(code) {
    let root;
    const JMB = {
      // We'll just assemble our VDOM-like here.
      createElement: (name, props, ...rest) => {
        root = {name, props};

        root.children = rest;

        return root;
      }
    };

    const result = eval(code) || {};

    return {result, root};
  }

  function attachPanel(element, currentRoot) {
    const panel = document.createElement('textarea');

    panel.className = 'editor-panel hidden';

    panel.value = code;

    panel.addEventListener('keyup', debounce(update, timeToUpdate));

    element.appendChild(panel);

    function update(event) {
      const newCode = panel.value;

      if (newCode !== code) updateScene(newCode); // possibly not the most efficient comparison? (might be!)

      function updateScene(newCode) {
        console.log('updating scene');
        try {
          const {result, root} = runMathBoxJsx(compile(newCode).code);

          view.remove('*');
          build(view, root);
          code = newCode; // should be somehwere else

         // patch(view, diff(currentRoot, root));
        }
        catch (e) {
          console.log('Failed to update', e);
        }
      }
    }
  }
}

function compile(text) {
  return transform(text, {
    presets: [es2015],
    plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
  });
}

function build(view, node) {
  const {name, children} = node;

  if (name !== 'root') handleChild(node);

  (children || []).forEach(child => build(view, child));

  return view;

  function handleChild({name, props}) {
    let props1 = {}, props2;

    for (let propName in props) handleProp(propName, props[propName]);

    view = view[name](props1, props2);

    function handleProp(propName, prop) {
      if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
      else (props1 = (props1 || {}))[propName] = prop;
    }
  }
}


function diff(oldObj, newObj) {
  console.log('diffing', oldObj, newObj);

  const oo = prep(oldObj),
        no = prep(newObj),
        changedKeys = difference(oo, no);


  console.log({changedKeys});



  // check for removals
  // check for adds
  // check adds to see if they contain a removed, if so, mark as moved
  return changedKeys;

  function prep(obj = {}) {
    return {keys: Object.keys(obj), obj};
  }

  function difference(oo, no) {
    const oldKeys = oo.keys.sort(),
          newKeys = no.keys.sort(),
          removedKeys = differenceSortedList1FromSortedList2(oldKeys, newKeys),
          addedKeys = differenceSortedList1FromSortedList2(newKeys, oldKeys),
          keysToCheck = differenceSortedList1FromSortedList2(differenceSortedList1FromSortedList2(newKeys, removedKeys), addedKeys),
          modifiedKeys = modifications(keysToCheck, oo.obj, no.obj);


    return {addedKeys, modifiedKeys, removedKeys};
  }

  function differenceSortedList1FromSortedList2(l1, l2) {
    const d = [];

    let j = 0,
        item2 = l2[j];
    for (let i = 0; i < l1.length; i++) {
      const item1 = l1[i];

      if (item1 !== item2) d.push(item1);
      else item2 = l2[++j];
    }

    // for (; j < l2.length; j++) d.push(l2[j]);

    return d;
  }

  function totalDifferenceOfSortedLists(l1, l2) {
    const d = [];

    let j = 0,
        item2 = l2[j];
    for (let i = 0; i < l1.length; i++) {
      const item1 = l1[i];

      if (item1 !== item2) d.push(item1);
      else item2 = l2[++j];
    }

    for (; j < l2.length; j++) d.push(l2[j]);

    return d;
  }

  function modifications(keysToCheck, oldObj, newObj) {
    const m = [];

    keysToCheck.forEach(key => (newObj[key] !== oldObj[key]) ? m.push(key) : undefined);

    return m;
  }
}

function patch(view, changes) {
  changes.forEach(applyToView);

  function applyToView(change) {
    const {type} = change;

    switch(type) {
      case 'remove': remove(view, change); break;
      case 'add': add(view, change); break;
      case 'move': move(view, change); break;
      case 'modify': modify(view, change); break;
    }

    function remove(view, change) {

    }

    function add(view, change) {

    }

    function move(view, change) {

    }

    function modify(view, change) {

    }

    function walkPath(view, path) {
      // should return the element selected by path
    }
  }
}

const obj1 = {
        // name: 'root',
        props: null,
        children: [{
          name: 'camera',
          props: {lookAt: [0, 0, 0]}
        }]
      },
      obj2 = {
        name: 'root',
        children: []
      };

diff(obj1, obj2);