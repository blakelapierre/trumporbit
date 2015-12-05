import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import scriptHandler from './scriptHandler';

scriptHandler('mathbox/jsx', (text, script) => {
  const mathBoxJsx = compile(text);

  const {mathbox, result: {commands, controls, onMathBoxViewBuilt}, root} = handleMathBoxJsx(mathBoxJsx.code),
        view = build(mathbox, root);

  window.view = view;

  (onMathBoxViewBuilt || set)(view, controls, commands);

  function compile(text) {
    return transform(text, {
      presets: [es2015],
      plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
    });
  }

  function handleMathBoxJsx(code) {
    const {result, root} = runMathBoxJsx(code),
          {attachTo, cameraControls, editorPanel, plugins} = result,
          element = attachTo || script.parentNode;

    const mathbox = mathBox({
      element,
      plugins: plugins || ['core', 'controls', 'cursor', 'stats'],
      controls: {
        klass: cameraControls || THREE.OrbitControls
      },
    });

    if (editorPanel) attachPanel(element, root);

    return {mathbox, result, root}; // possibly dangerous semantics...

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
      const panel = document.createElement('div');

      panel.className = 'editor-panel hidden';

      panel.innerText = text;

      panel.contentEditable = true;

      panel.addEventListener('keydown', update);

      element.appendChild(panel);

      function update(event) {
        const code = panel.innerText,
              {result, root} = runMathBoxJsx(compile(code).code);

        console.log({result, currentRoot, root});
      }
    }
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

  function set(view, controls, commands) {
    if (controls === undefined || commands === undefined) return;

    addListeners(generateActionHandler(controls, define(commands)));

    function define(commands) {
      return mapValues(commands, process);

      function process(commandName, command) {
        return typeof command === 'function' ? command : multipleProps;

        function multipleProps(view, keyCode) { // shouldn't be keycode here...
          for (let name in command) runCommand(name, command);

          function runCommand(name, command) {
            const props = command[name],
                  element = proxied(view.select(name));
            for (let propName in props) updateProp(propName, props[propName], element);
          }
        }
      }

      function updateProp(propName, action, {get, set}) {
        let isComplex = action !== 'function',
            getNewValue = isComplex ? getComplexPropValue : action;

        set(propName, getNewValue(get(propName)));

        function getComplexPropValue(propValue) {
          const {length} = action,
                fnIndex = length - 1,
                fn = action[fnIndex],
                dependencies = action.slice(0, fnIndex).map(get),
                parameters = [propValue, ...dependencies];

          return fn.apply(undefined, parameters);
        }
      }
    }

    function generateActionHandler(controls, commands) {
      const actions = buildActions();

      return keyCode => (actions[keyCode] || noActionHandler)(view, keyCode);

      function buildActions() {
        return controls.reduce((actions, [keys, commandName]) => {
          (typeof keys === 'number' ? [keys] : keys).forEach(setAction);

          return actions;

          function setAction(key) { actions[typeof key === 'number' ? key : key.charCodeAt(0)] = commands[commandName]; }
        }, {});
      }

      function noActionHandler(view, keyCode) { console.log(`No action for ${keyCode} on ${view}`); }
    }

    function addListeners(actionHandler) {
      const box = view._context.canvas.parentElement;
      focusOn(box, 'mousedown');

      window.addEventListener('keydown', // this is a bit problematic...binding to global event, multiple timess
        event => event.target === box ? actionHandler(event.keyCode)
                                      : console.log(event, view));

      function focusOn(el, eventName) { return el.addEventListener(eventName, () => el.focus()); }
    }
  }

  function proxied(obj) {
    return {
      get: (...args) => obj.get.apply(obj, args),
      set: (...args) => obj.set.apply(obj, args)
    };
  }

  function mapValues(obj, t) {
    const ret = {};
    for (let name in obj) ret[name] = t(name, obj[name]);
    return ret;
  }
});