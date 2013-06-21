var env = process.env.NODE_ENV
var port = (env == 'production' ? 80 : 3000)

require('./app').listen(port)
