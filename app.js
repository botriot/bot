
/**
 * Module dependencies.
 */

var settings = require('./settings').init('app')

var express = require('express')

var app = module.exports = express.createServer()

var mongooseAuth = require('mongoose-auth')
  , io = require('socket.io')
  , sio = require('socket.io-sessions')
  , MyStore = express.session.MemoryStore
  , sessionStore = settings.sessionStore

require('./models')

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views')
  app.set('view engine', 'ejs')
  app.use(express.logger())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.cookieParser())
  app.use(express.session({secret: 'thisisamotherfuckingsecret', store: sessionStore}))
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }))
  app.use(mongooseAuth.middleware())
  app.use(express.static(__dirname + '/public'))
})

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
})

app.configure('production', function(){
  app.use(express.errorHandler())
})

var io = require('socket.io').listen(app)

// Websockts broken in Chrome 14
// io.set('transports', [
//   'htmlfile',
//   'xhr-polling',
//   'jsonp-polling'
// ])

io.set('log level', settings.config.socketio.loglevel)

var socket = sio.enable({
  socket: io,
  store: sessionStore,
  parser: express.cookieParser() 
})

// Sockets

require('./sockets')(app, socket)

// Routes

require('./routes')(app, socket)

mongooseAuth.helpExpress(app)

if (require.main === module) {
  app.listen(3000)
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env)
}
