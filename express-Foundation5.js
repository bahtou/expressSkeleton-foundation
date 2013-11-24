#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander')
  , mkdirp = require('mkdirp')
  , pkg = require('../package.json')
  , version = pkg.version
  , os = require('os')
  , fs = require('fs');

// CLI

program
  .version(version)
  .usage('[options] [dir]')
  .option('-s, --sessions', 'add session support')
  .option('-e, --ejs', 'add ejs engine support (defaults to jade)')
  .option('-J, --jshtml', 'add jshtml engine support (defaults to jade)')
  .option('-H, --hogan', 'add hogan.js engine support')
  .option('-c, --css <engine>', 'add stylesheet <engine> support (less|stylus) (defaults to plain css)')
  .option('-f, --force', 'force on non-empty directory')
  .parse(process.argv);

// Path

var path = program.args.shift() || '.';

// end-of-line code

var eol = os.EOL

// Template engine

program.template = 'jade';
if (program.ejs) program.template = 'ejs';
if (program.jshtml) program.template = 'jshtml';
if (program.hogan) program.template = 'hjs';

/**
 * Routes index template.
 */

var index = [
  '"use strict";'
  , ''
  , 'module.exports = exports = function(app) {'
  , ''
  , '  app.get(\'/\', function(req, res) {'
  , '    res.render(\'index\', { title: \'Express\' });'
  , '    return;'
  , '  });'
  , ''
  , '  app.get(\'/users\', function(req, res) {'
  , '    res.send("respond with a resource");'
  , '    return;'
  , '  });'
  , '};'
].join(eol);

/**
 * Routes users template.
 */

/**
 * Jade layout template.
 */

var jadeLayout = [
    '!!! 5'
  , 'html(lang="en")'
  , '  head'
  , '    title= title'
  , '    link(rel=\'stylesheet\', href=\'/styles/style.css\')'
  , '  body'
  , '    block content'
].join(eol);

/**
 * Jade index template.
 */

var jadeIndex = [
    'extends layout'
  , ''
  , 'block content'
  , '  h1= title'
  , '  p Welcome to #{title}'
].join(eol);

/**
 * EJS index template.
 */

var ejsIndex = [
    '<!DOCTYPE html>'
  , '<html>'
  , '  <head>'
  , '    <title><%= title %></title>'
  , '    <link rel=\'stylesheet\' href=\'/styles/style.css\' />'
  , '  </head>'
  , '  <body>'
  , '    <h1><%= title %></h1>'
  , '    <p>Welcome to <%= title %></p>'
  , '  </body>'
  , '</html>'
].join(eol);

/**
 * JSHTML layout template.
 */

var jshtmlLayout = [
    '<!DOCTYPE html>'
  , '<html>'
  , '  <head>'
  , '    <title> @write(title) </title>'
  , '    <link rel=\'stylesheet\' href=\'/styles/style.css\' />'
  , '  </head>'
  , '  <body>'
  , '    @write(body)'
  , '  </body>'
  , '</html>'
].join(eol);

/**
 * JSHTML index template.
 */

var jshtmlIndex = [
    '<h1>@write(title)</h1>'
  , '<p>Welcome to @write(title)</p>'
].join(eol);

/**
 * Hogan.js index template.
 */
var hoganIndex = [
    '<!DOCTYPE html>'
  , '<html>'
  , '  <head>'
  , '    <title>{{ title }}</title>'
  , '    <link rel=\'stylesheet\' href=\'/styles/style.css\' />'
  , '  </head>'
  , '  <body>'
  , '    <h1>{{ title }}</h1>'
  , '    <p>Welcome to {{ title }}</p>'
  , '  </body>'
  , '</html>'
].join(eol);

/**
 * Default css template.
 */

var css = [
    'body {'
  , '  padding: 50px;'
  , '  font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;'
  , '}'
  , ''
  , 'a {'
  , '  color: #00B7FF;'
  , '}'
].join(eol);

/**
 * Default less template.
 */

var less = [
    'body {'
  , '  padding: 50px;'
  , '  font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;'
  , '}'
  , ''
  , 'a {'
  , '  color: #00B7FF;'
  , '}'
].join(eol);

/**
 * Default stylus template.
 */

var stylus = [
    'body'
  , '  padding: 50px'
  , '  font: 14px "Lucida Grande", Helvetica, Arial, sans-serif'
  , 'a'
  , '  color: #00B7FF'
].join(eol);

/**
 * App template.
 */

var app = [
  '"use strict";'
  , 'var express = require(\'express\')'
  , '  , app = express();'
  , ''
  , 'var routes = require(\'./routes\')'
  , '  , http = require(\'http\')'
  , '  , path = require(\'path\');'
  , ''
  , '// all environments'
  , 'app.set(\'port\', process.env.PORT || 3000);'
  , 'app.set(\'views\', path.join(__dirname, \'views\'));'
  , 'app.set(\'view engine\', \':TEMPLATE\');'
  , 'app.use(express.favicon());'
  , 'app.use(express.logger(\'dev\'));'
  , 'app.use(express.json());'
  , 'app.use(express.urlencoded());'
  , 'app.use(express.methodOverride());{sess}'
  , 'app.use(app.router);{css}'
  , 'app.use(express.static(path.join(__dirname, \'public\')));'
  , ''
  , '// development only'
  , 'app.configure(\'development\', function() {'
  , '  app.use(express.errorHandler({showStack: true, dumpExceptions: true}));'
  , '  app.locals.pretty = true;'
  , '});'
  , ''
  , 'routes(app);'
  , ''
  , 'http.createServer(app).listen(app.get(\'port\'), function() {'
  , '  console.log(\'Express server listening on port \' + app.get(\'port\'));'
  , '});'
  , ''
].join(eol);

// Generate application

(function createApplication(path) {
  emptyDirectory(path, function(empty){
    if (empty || program.force) {
      createApplicationAt(path);
    } else {
      program.confirm('destination is not empty, continue? ', function(ok){
        if (ok) {
          process.stdin.destroy();
          createApplicationAt(path);
        } else {
          abort('aborting');
        }
      });
    }
  });
})(path);

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */

function createApplicationAt(path) {
  console.log();
  process.on('exit', function(){
    console.log();
    console.log('   install dependencies:');
    console.log('     $ cd %s && npm install', path);
    console.log();
    console.log('   run the app:');
    console.log('     $ node app');
    console.log();
  });

  mkdir(path, function(){
    mkdir(path + '/public');
    mkdir(path + '/public/js');
    mkdir(path + '/public/imgs');
    mkdir(path + '/public/styles', function(){
      switch (program.css) {
        case 'less':
          write(path + '/public/styles/style.less', less);
          break;
        case 'stylus':
          write(path + '/public/styles/style.styl', stylus);
          break;
        default:
          write(path + '/public/styles/style.css', css);
      }
    });

    mkdir(path + '/routes', function(){
      write(path + '/routes/index.js', index);
    });

    mkdir(path + '/views', function(){
      switch (program.template) {
        case 'ejs':
          write(path + '/views/index.ejs', ejsIndex);
          break;
        case 'jade':
          write(path + '/views/layout.jade', jadeLayout);
          write(path + '/views/index.jade', jadeIndex);
          break;
        case 'jshtml':
          write(path + '/views/layout.jshtml', jshtmlLayout);
          write(path + '/views/index.jshtml', jshtmlIndex);
          break;
        case 'hjs':
          write(path + '/views/index.hjs', hoganIndex);
          break;

      }
    });

    // CSS Engine support
    switch (program.css) {
      case 'less':
        app = app.replace('{css}', eol + 'app.use(require(\'less-middleware\')({ src: path.join(__dirname, \'public\') }));');
        break;
      case 'stylus':
        app = app.replace('{css}', eol + 'app.use(require(\'stylus\').middleware(path.join(__dirname, \'public\')));');
        break;
      default:
        app = app.replace('{css}', '');
    }

    // Session support
    app = app.replace('{sess}', program.sessions
      ? eol + 'app.use(express.cookieParser(\'your secret here\'));' + eol + 'app.use(express.cookieSession({' + eol + 'key: \'__RequestValidationToken\',' + eol + 'secret: \'groupBlog_$&$_Beginnings\',' + eol + 'cookie: {httpOnly: true, expires: 0, path: \'/\'}' + eol + '}));'
      : '');

    // Template support
    app = app.replace(':TEMPLATE', program.template);

    // package.json
    var pkg = {
        name: 'application-name'
      , version: '0.0.1'
      , private: true
      , scripts: { start: 'node app.js' }
      , dependencies: {
        express: version
      }
    }

    if (program.template) pkg.dependencies[program.template] = '*';

    // CSS Engine support
    switch (program.css) {
      case 'less':
        pkg.dependencies['less-middleware'] = '*';
        break;
      default:
        if (program.css) {
          pkg.dependencies[program.css] = '*';
        }
    }

    write(path + '/package.json', JSON.stringify(pkg, null, 2));
    write(path + '/app.js', app);
  });
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) throw err;
    fn(!files || !files.length);
  });
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write(path, str) {
  fs.writeFile(path, str);
  console.log('   \x1b[36mcreate\x1b[0m : ' + path);
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */

function mkdir(path, fn) {
  mkdirp(path, 0755, function(err){
    if (err) throw err;
    console.log('   \033[36mcreate\033[0m : ' + path);
    fn && fn();
  });
}

/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */

function abort(str) {
  console.error(str);
  process.exit(1);
}
