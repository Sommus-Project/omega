function openDialog(dialogId, {root = document, preSubmit, init} = {}) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const dialogEl = root.getElementById(dialogId);
    if (!dialogEl) {
      reject(new Error('Dialog does not exist'));
    }
    const activeElement = document.activeElement;
    dialogEl.onclose = () => activeElement.focus();
    dialogEl.oncancel = () => resolve({ action: 'cancel' });
    const errorEl = dialogEl.querySelector('.dialog_error');

    function clearError() {
      if (errorEl) {
        errorEl.textContent = '';
      }
    }

    async function handler(evt) {
      const action = evt.target.getAttribute('dialog-action');
      if (action) {
        evt.stopPropagation();
        evt.preventDefault()
        console.log(`handler triggered`);
        console.log(evt);
        const resp = { action };
        if (action !== 'cancel') {
          resp.data = {};
          dialogEl.querySelectorAll('[name]').forEach(el => {
            if (el.tagName === 'TEXTAREA') {
              resp.data[el.name] = el.value;
            }
            else if (el.tagName === 'INPUT') {
              if (el.type.toLowerCase() === 'checkbox') {
                if (el.checked) {
                  if (!resp.data[el.name]) {
                    resp.data[el.name] = el.value;
                  }
                  else {
                    if (!Array.isArray(resp.data[el.name])) {
                      resp.data[el.name] = [resp.data[el.name]];
                    }
                    resp.data[el.name].push(el.value);
                  }
                }
              }
              else if (el.type.toLowerCase() === 'radio' && el.checked) {
                resp.data[el.name] = el.value;
              }
              else {
                resp.data[el.name] = el.value.trim();
              }
            }
            else if (el.tagName === 'SELECT') {
              [...el.options].forEach(o => {
                if (o.selected) {
                  if (!resp.data[el.name]) {
                    resp.data[el.name] = o.value;
                  }
                  else {
                    if (!Array.isArray(resp.data[el.name])) {
                      resp.data[el.name] = [resp.data[el.name]];
                    }
                    resp.data[el.name].push(o.value);
                  }
                }
              });
            }
          });

          if (typeof preSubmit === 'function') {
            // TODO: Set spinner
            const temp = await preSubmit(resp, dialogEl);
            // TODO: Clear spinner
            if (temp) {
              // If they return true then do NOT close the dialog
              return;
            }
          }
        }

        dialogEl.removeEventListener('click', handler);
        dialogEl.removeEventListener('input', clearError);
        dialogEl.close();
        resolve(resp);
      }
    }

    if (typeof init === 'function') {
      init(dialogEl);
    }
    else {
      const forms = dialogEl.querySelectorAll('form');
      if (forms.length > 0) {
        forms.forEach(form => form.reset());
      }
      else {
        dialogEl.querySelectorAll('[name]').forEach(el => {
          if (el.tagName === 'TEXTAREA') {
            el.value = el.defaultValue;
          }
          else if (el.tagName === 'INPUT') {
            if (['checkbox','radio'].includes(el.type.toLowerCase())) {
              el.checked = el.hasAttribute('checked');
            }
            else {
              el.value = el.getAttribute('value')||'';
            }
          }
          else if (el.tagName === 'SELECT') {
            let found = false;
            [...el.options].forEach(o => {
              o.selected = o.hasAttribute('selected');
              found = found || o.selected;
            });
            if (!found) {
              el.options[0].selected = true;
            }
          }
        });
      }
    }

    dialogEl.addEventListener('click', handler);
    dialogEl.addEventListener('input', clearError);
    dialogEl.showModal();
    /*
    // Autofocus seems to happen automatically in the dialog element
    const temp = dialogEl.querySelector('[autofocus]');
    if (temp) {
      temp.focus();
      temp.select();
    }
    else {
      dialogEl.focus();
    }
    */
  });
}
