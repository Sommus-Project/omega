const path = require('path').posix;
const md = require('markdown-it')({html: true, xhtmlOut: true, breaks: true});
const {loadJsonFile} = require('@sp/omega-lib');
const HTTPS_STATUS = require('./HTTPS_STATUS.js');
const convertMarkdown = (str='') => md.render(str);
const PERMISSIONS_USER = 'user';
const PERMISSIONS_ROLE = 'role';
const EMPTY_EXAMPLE = { title: '', format: '', status: '', example: '' };

function convertParams(params, label='Request Parameters') {
  var ret = '';
  if (params && params.length > 0) {
    ret = `<label>${label}</label>
  <table class="endpoint-params">
  <tr>
    <th>name</th>
    <th>type</th>
    <th width="100%">description</th>
    <th>default</th>
    <th>constraint</th>
  </tr>
  ${params.map(
    param => `  <tr class="endpoint-param--${param.type}">
    <td class="param-name"${param.optional?' optional':''}>${param.field}</td>
    <td class="param-type">${param.type}</td>
    <td>${convertMarkdown(param.description).trim()}</td>
    <td>${param.default||''}</td>
    <td>${param.constraint||''}</td>
  </tr>
`).join('')}
  </table>`;
  }

  return ret;
}

function sortExamples(examples) {
  return (a,b) => {
    const sa = (((examples[a]||{}).response||EMPTY_EXAMPLE).status||'').split('-')[0];
    const sb = (((examples[b]||{}).response||EMPTY_EXAMPLE).status||'').split('-')[0];

    if (sa < sb) {
      return -1;
    }
    if (sa > sb) {
      return 1;
    }

    return 0;
  }
}

const getExampleValue = (src, type, field) => src && src[type] && src[type][field];
const minHtmlEncode = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
  '<': '&lt;',
  '>': '&gt;'
}

const htmlEncode = html => html.replace(/([<>&"'])/g, (a,b) => minHtmlEncode[b])

function getExampleHeaders(src) {
  let ret = '';
  if (src) {
    if (src.cookie) {
      ret = 'Cookie: '+Object.entries(src.cookie).map(
        ([cookie, value]) => `${cookie}=${value};`
      ).join('')+'\n';
    }

    if (src.header) {
      ret += Object.entries(src.header).map(
        ([header, value]) => `${header}: ${value}\n`
      ).join('');
    }
  }

  return htmlEncode(ret);
}

function convertExamples(examples, method, origUrl) {
  let ret = '';

  const keys = Object.keys(examples).sort(sortExamples(examples));
  if (keys.length > 0) {
    ret = `<div class="examples">
    ${keys.map(
      (key, idx) => { // eslint-disable-line complexity
        const example = examples[key];
        const request = example.request || EMPTY_EXAMPLE;
        const response = example.response || EMPTY_EXAMPLE;
        const status = (response.status || request.status);
        const requestValues = example.requestValues || {};
        const responseValues = example.responseValues || {};
        const statusNum = status.split('-')[0];
        let url = origUrl.replace(/:([A-Z]+)/gi, (a,b) => {
          const val = getExampleValue(requestValues, 'path', b)
          return val || a;
        });

        if (requestValues.query) {
          url += '?'+Object.entries(requestValues.query).map(
            ([query, value]) => `${query}=${value}`
          ).join('&');
        }

        url = encodeURI(url);

        let requestExample = `${method} ${url} HTTP/1.1\nAccept: ${response.format}\n${getExampleHeaders(requestValues)}`;
        if (request.example.length > 0 && (method==='POST'||method==='PUT')) {
          requestExample += `Content-Type: ${request.format}\nContent-Length: ${request.example.length}\n\n${htmlEncode(request.example)}`
        }

        let responseExample = `HTTP/1.1 ${statusNum} ${HTTPS_STATUS[statusNum]}\n${getExampleHeaders(responseValues)}`;
        if (response.example.length > 0) {
          responseExample += `Content-Type: ${response.format}\nContent-Length: ${response.example.length}\n\n${htmlEncode(response.example)}`
        }

        return `<div class="example" example="${idx}">
          <div class="example-request">
            <div class="example-title">Request: ${convertMarkdown(request.title)}</div>
            <pre example="${idx}" class="example-code">${requestExample}</pre>
          </div>
          <div class="example-response">
            <div class="example-title">Response: ${status} - ${convertMarkdown(response.title)}</div>
            <pre example="${idx}" class="example-code">${responseExample}</pre>
          </div>
        </div>`;
      }
    ).join('')}
    </div>`
  }

  return ret;
}

function convertPermissions(permissions) {
  let value = 'None'
  let type = permissions.type.toLowerCase();
  if (type === PERMISSIONS_USER) {
    value = 'Logged in user';
  }
  else if (type === PERMISSIONS_ROLE) {
    value = `One of the following roles: ${permissions.permissions}`;
  }

  return `<div class="permissions"><label>Permissions:</label> <span class="permissions-value">${value}</span></div>`;
}

function convertEndpoints(item) {
  return `<div class="endpoint" closed>
  <div class="endpoint-header" onclick="handleClick(this)">
  <span class="endpoint-method">
    <span class="method-${item.method.toLowerCase()}">${item.method}</span>
  </span>
  <span class="endpoint-url">${item.url}</span>
  <span class="endpoint-title">${convertMarkdown(item.title)}</span>
  ${item.stability ? `<span class="endpoint-stability stability-${item.stability}">${item.stability}</span>` : ''}
  </div>
  <div class="endpoint-details">
    <div class="endpoint-source">Source File: <b>${item.src}</b></div>
    <div class="endpoint-description">${convertMarkdown(item.description)}</div>
  </div>
  ${convertPermissions(item.permissions)}
  ${convertParams(item.params)}
  ${convertExamples(item.examples, item.method, item.url)}
</div>
`;
}

function apiDocs(config) {
  return (req, res) => {
    // TODO: Use a Query param to get the version??
    let pageNav = '';
    let pageDocs = '';

    // TODO: Handle the combination of all docs based on the array config.folders
    const name = path.join(config.folders[0], 'apidocs.json');
    const json = loadJsonFile(name);
    if (json == null) {
      throw new Error('Unable to generate API file. The API descriptor file `apidocs.json` was not found.');
    }

    const sections = Object.keys(json).sort();
    sections.forEach(
      function(section) {
        const item = json[section];
        pageDocs += `<div class="api-group" closed>
<div class="api-group--title" onclick="handleClick(this)">${section} - <span class="api-group--url">${item.url}</span></div>
<div class="api-group--desc">${convertMarkdown(item.description)}${convertParams(item.params, 'Global Request Params')}</div>
${item.endpoints.map(convertEndpoints).join('')}
<div class="endpoint-spacer"></div>
</div>\n`;
      }
    );

    const pageParams = {
      json,
      pageNav,
      pageDocs
    }

    res.render('apidocs', pageParams);
  }
}

module.exports = apiDocs;
