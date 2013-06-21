var http = require('http')

var createPastie = function(txt, callback) {
  var body = 'paste[authorization]=burger&paste[restricted]=1&paste[body]='+txt
  var request = http.request({
      host: 'pastie.org',
      path: '/pastes/create',
      method: 'POST',
      port: '80',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': body.length
      }

    },
    function(resp) {
      resp.setEncoding('utf8')
      resp.on('data', function(chunk) {
        var match = chunk.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)
        callback(null, match[0])
      })

      resp.on('error', function(error) {
        callback(error)
      })
    }
  )

  request.write(body)
  request.end()
}

module.exports = {
  createPastie: createPastie
}

if(module === process.mainModule) {
  createPastie('testing', function (err, paste) {
    var match = paste.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)
    console.log(err, match[0])
  })
}
