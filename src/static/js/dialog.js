function openDialog(dialogId, root = document) { // eslint-disable-line no-unused-vars
  return new Promise((resolve, reject) => {
    const dlg = root.getElementById(dialogId);
    if (!dlg) {
      reject(new Error('Dialog does not exist'));
    }
    const activeElement = document.activeElement;
    dlg.onclose = () => activeElement.focus();
    dlg.oncancel = () => resolve({ action: 'cancel' });

    function handler(dlg) {
      return (evt) => {
        const action = evt.target.getAttribute('dialog-action');
        if (action) {
          dlg.removeEventListener('click', handler);
          evt.stopPropagation();
          evt.preventDefault()
          const resp = {action};
          if (action !== 'cancel') {
            resp.data = {};
            dlg.querySelectorAll('[name]').forEach(el => {
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
          }
          dlg.close();
          resolve(resp);
        }
      }
    }

    const forms = dlg.querySelectorAll('form');
    if (forms.length > 0) {
      forms.forEach(form => form.reset());
    }
    else {
      dlg.querySelectorAll('[name]').forEach(el => {
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
    dlg.addEventListener('click', handler(dlg));
    dlg.showModal();
    /*
    // Autofocus seems to happen automatically
    const temp = dlg.querySelector('[autofocus]');
    if (temp) {
      temp.focus();
      temp.select();
    }
    else {
      dlg.focus();
    }
    */
  });
}