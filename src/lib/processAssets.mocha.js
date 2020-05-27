/* eslint-env mocha */
const expect = require('chai').expect;
const processAssets = require('./processAssets');
var mockRes;

describe('processAssets.js tests', function() {
  var processScripts, processStyles, processMeta, cb;

  beforeEach(() => {
    cb = Math.round(Math.random()*100);
    mockRes = {
      locals: {
        browserNeeds: {
          promise: false,
          fetch: false,
          custEl: false,
          assign: false,
          custEvt: false,
          entries: false,
          values: false
        }
      }
    }
    const init = processAssets(cb);
    processScripts = init.processScripts;
    processStyles = init.processStyles;
    processMeta = init.processMeta;
  });

  it('should init', function() {
    expect(processScripts).to.be.a('function');
    expect(processStyles).to.be.a('function');
    expect(processMeta).to.be.a('function');
  });

  describe('processMeta tests', function() {
    it('should process values', function() {
      var str = processMeta([
        {name:'dog', value:'woof'},
        {name:'cat-scratch', value:'fever'}
      ]);
      expect(str).to.eql('<meta name="dog" value="woof">\n  <meta name="cat-scratch" value="fever">');
    });

    it('should default to nothing', function() {
      var str = processMeta();
      expect(str).to.eql('');
    });

    it('should process values', function() {
      function doit() {
        processMeta('das');
      }

      expect(doit).to.throw();
    });
  });

  describe('processScripts tests', function() {
    var psFn;

    beforeEach(() => {
      psFn = processScripts(mockRes);
    })

    it('should process empty list', function() {
      var val = psFn().trim();
      expect(val).to.equal('');
    });

    it('should process one entry', function() {
      var val = psFn([{src:'myFile',dog:'bark',async:false}]).trim();
      expect(val).to.equal(`<script src="myFile?cb=${cb}" dog="bark"></script>`);
    });

    it('should process one entry with require', function() {
      var val = psFn([{dog:'bark',require:'myFile.js'}]).trim();
      expect(val).to.equal('<script src="/js/inject.min.js"></script>\n  <script>\n    window.define = null; // Totally disable the AMD ability to prevent failures when loading in IE11.\n    // Setup for inject\n    Inject.reset();\n    Inject.setExpires(0); //Don\'t store files in localStorage\n    Inject.setModuleRoot(\'/\');\n    Inject.disableAMD(true);\n  </script>\n\n  <script dog="bark">require.ensure([\'myFile.js\']);</script>');
    });

    it('should process one entry then one entry with require', function() {
      var val = psFn([{src:'myFile',dog:'bark',async:false}]).trim();
      expect(val).to.equal(`<script src="myFile?cb=${cb}" dog="bark"></script>`);
      val = psFn([{dog:'bark',require:'myFile.js'}]).trim();
      expect(val).to.equal('<script src="/js/inject.min.js"></script>\n  <script>\n    window.define = null; // Totally disable the AMD ability to prevent failures when loading in IE11.\n    // Setup for inject\n    Inject.reset();\n    Inject.setExpires(0); //Don\'t store files in localStorage\n    Inject.setModuleRoot(\'/\');\n    Inject.disableAMD(true);\n  </script>\n\n  <script dog="bark">require.ensure([\'myFile.js\']);</script>');
    });

    it('should process handle bad entries with require', function() {
      function doit() {
        psFn([{src:'asd',dog:'bark',require:'myFile.js'}]).trim();
      }

      expect(doit).to.throw();
    });

    it('should process one entry with polyfills', function() {
      mockRes.locals.browserNeeds ={
        assign: true,
        entries: true,
        values: true,
        custEvt: true,
        promise: true,
        fetch: true,
        number: true,
        afrom: true,
        string: true,
        strpad: true,
        custEl: true
      };
      var val = psFn([{src:'myFile',defer:true}]).trim();
      expect(val).to.equal(`<script src="/js/polyfill/object.assign.min.js"></script>\n  <script src="/js/polyfill/object.entries.min.js"></script>\n  <script src="/js/polyfill/object.values.min.js"></script>\n  <script src="/js/polyfill/customevent.min.js"></script>\n  <script src="/js/polyfill/promise.min.js"></script>\n  <script src="/js/polyfill/fetch.min.js"></script>\n  <script src="/js/polyfill/number.min.js"></script>\n  <script src="/js/polyfill/array.from.min.js"></script>\n  <script src="/js/polyfill/string.min.js"></script>\n  <script src="/js/polyfill/string.pad.min.js"></script>\n  <script src="/js/polyfill/template.min.js"></script>\n  <script src="/js/polyfill/custom-elements.min.js"></script>\n\n  <script src="myFile?cb=${cb}" defer></script>`);
    });
  });

  describe('processStyles tests', function() {
    var psFn;

    beforeEach(() => {
      psFn = processStyles(mockRes);
    })

    it('should process empty list', function() {
      var val = psFn().trim();
      expect(val).to.equal('');
    });

    it('should process one entry', function() {
      var val = psFn([{href:'myFile',dog:'bark',async:false}]).trim();
      expect(val).to.equal(`<link href="myFile?cb=${cb}" dog="bark" async="false">`);
    });

    it('should handle funny attributes', function() {
      var val = psFn([{href:'myFile',dog:'"bark"',async:false}]).trim();
      expect(val).to.equal(`<link href="myFile?cb=${cb}" dog="&quot;bark&quot;" async="false">`);
    });
  });
});
