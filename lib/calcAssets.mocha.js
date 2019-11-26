/* eslint-env mocha */
const expect = require('chai').expect;
const calcAssets = require('./calcAssets');
var srcFiles = [];

describe('calcAssets.js tests', function() {
  beforeEach(() => {
    srcFiles = [];
  });

  it('should init', function() {
    expect(calcAssets).to.be.a('function');
    var fn = calcAssets();
    expect(fn).to.be.a('function');
  });

  it('should handle passing in nothing', function() {
    var fn = calcAssets('mjs', srcFiles);
    var retVal = fn();
    expect(retVal).to.eql({script:{head:[],body:[]},css:{head:[],body:[]},usingRequire:false});
  });

  it('should handle empty file list', function() {
    var fn = calcAssets('mjs', srcFiles);
    var assets = {
      head: {
        js: [],
        css: []
      },
      js: [],
      css: []
    };
    var retVal = fn(assets);
    expect(retVal).to.eql({script:{head:[],body:[]},css:{head:[],body:[]},usingRequire:false});
  });

  it('should prevent duplication', function() {
    const fname = '/cat.js';
    srcFiles.push(fname);
    var fn = calcAssets('mjs', srcFiles);
    var assets = {
      head: {
        js: [
          fname
        ]
      },
      js: [
        fname
      ]
    };

    var retVal = fn(assets);
    expect(retVal).to.eql({script:{head:[{'src': fname}],body:[]},css:{head:[],body:[]},usingRequire:false});
  });

  describe('processing JS files', function() {
    it('should handle just js files for MJS', function() {
      srcFiles = ['dog.js', '/mjs/cat.js'];
      var fn = calcAssets('mjs', srcFiles);
      var assets = {
        js: [
          'dog.js',
          {src:'cat.js',async:true,type:'module'}
        ]
      };
      var retVal = fn(assets);
      expect(retVal).to.eql({
        script:{
          head:[],
          body:[
            {
              src: 'dog.js'
            },
            {
              async: true,
              type: 'module',
              src: '/mjs/cat.js'
            }
          ]
        },
        css:{
          head:[],
          body:[]
        },
        usingRequire:false
      });
    });

    it('should handle just js files for CJS', function() {
      srcFiles = ['/cjs/cat.js'];
      var fn = calcAssets('cjs', srcFiles);
      var assets = {
        head: {
          js: [
            {src:'cat.js',type:'module'}
          ]
        }
      };
      var retVal = fn(assets);
      expect(retVal).to.eql({
        script:{
          head:[
            {
              'require': '/cjs/cat.js'
            }
          ],
          body: []
        },
        css:{
          head:[],
          body:[]
        },
        usingRequire:true
      });
    });

    it('should throw error with missing src attr', function() {
      var fn = calcAssets('mjs', srcFiles);
      var assets = {
        head:[],
        js: [
          {srcs:'cat.js'}
        ]
      };

      function doit() {
        fn(assets);
      }

      expect(doit).to.throw();
    });

    it('should throw error with bad module', function() {
      var fn = calcAssets('mjs', srcFiles);
      var assets = {
        js: [
          {src:'/cat.js',type:'module'}
        ]
      };
      function doit() {
        fn(assets);
      }

      expect(doit).to.throw();
    });
  });

  describe('processing CSS files', function() {
    it('should handle just css files for body', function() {
      srcFiles = ['cat.css'];
      var fn = calcAssets('mjs', srcFiles);
      var assets = {
        css: [
          'http://www.site.com/dog.css',
          {href:'cat.css', media:'print'}
        ]
      };
      var retVal = fn(assets);
      expect(retVal).to.eql({
        script:{
          head:[],
          body:[]
        },
        css:{
          head:[],
          body:[
            {
              href: 'http://www.site.com/dog.css',
              rel: 'stylesheet'
            },
            {
              href: 'cat.css',
              rel: 'stylesheet',
              media: 'print'
            }
          ]
        },
        usingRequire:false
      });
    });

    it('should handle just css files for head', function() {
      srcFiles = ['cat.css'];
      var fn = calcAssets('cjs', srcFiles);
      var assets = {
        head: {
          css: [
            'cat.css'
          ]
        }
      };
      var retVal = fn(assets);
      expect(retVal).to.eql({
        script:{
          head:[],
          body: []
        },
        css:{
          head:[
            {
              href: 'cat.css',
              rel: 'stylesheet'
            }
          ],
          body:[]
        },
        usingRequire:false
      });
    });
  });
});
