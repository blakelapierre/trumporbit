import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './debounce';
import unindent from './unindent';

import {diff, patch} from './diffpatch';

const timeToUpdate = 1000; // In milliseconds

// pretty terrible globals
window.mathboxes = window.mathboxes || [];
let boxes = window.mathboxes;

export default function attachMathBox(code, parentNode) {
  const {view, result, root} = handleMathBoxJsx(unindent(code))(parentNode),
        {commands, controls, onMathBoxViewBuilt} = result;

  build(view, root);

  if (onMathBoxViewBuilt) onMathBoxViewBuilt(view, controls, commands);
  if (attachControls) attachControls(view, controls, commands);

  boxes.push({parentNode, commands, controls, result, view});
}

function handleMathBoxJsx(code) {
  const {result, root} = runMathBoxJsx(compile(code).code),
        {attachTo, cameraControls, editorPanel, plugins} = result;

  return parentNode => {
    const element = attachTo || parentNode; // kind of strange. oh well

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

    function attachPanel(element, currentRoot) {
      const updateStrategies = {
        'replace': replaceStrategy,
        'diffpatch': diffpatchStrategy
      }, currentUpdateStrategy = 'replace';

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

            updateStrategies[currentUpdateStrategy](view, root, newCode);

            code = newCode;
          }
          catch (e) {
            console.log('Failed to update', e);
          }
        }
      }

      function replaceStrategy(view, root, newCode) {
        view.remove('*');
        build(view, root);
      }

      function diffpatchStrategy(view, root, newCode) {
        patch(view, diff(currentRoot, root));
      }
    }
  };

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