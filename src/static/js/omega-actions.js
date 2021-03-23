const actionFunctions = {};

function triggerAction(code, evt = {}) {
  const [action, ...values] = code.split(':');
  if (action && actionFunctions[action]) {
    evt.action = action;
    actionFunctions[action].every(func => func(evt, ...values));
  }
}

document.addEventListener('click', (evt) => {
  const action = evt.target.getAttribute('action');
  if (action) {
    evt.stopPropagation();
    evt.preventDefault()
    triggerAction(action, evt);
  }
})

function addActionHandler(action, func) { // eslint-disable-line no-unused-vars
  if (!action || typeof func !== 'function') {
    throw new Error('action must be defined and func must be supplied as a function');
  }

  actionFunctions[action] = actionFunctions[action] || [];
  // Add the function to the list
  actionFunctions[action].push(func);
  return () => {
    // Remove the function from the list
    actionFunctions[action] = actionFunctions[action].filter(temp => temp !== func);
  }
}
