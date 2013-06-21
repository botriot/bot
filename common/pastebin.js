var http = require('http')
  , token = ''

var createPastebin = function(txt, callback) {
  var body = 'api_dev_key='+token+'&api_paste_code='+txt+'&api_option=paste'
  var request = http.request({
      host: 'pastebin.com',
      path: '/api/api_post.php',
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
        callback(null, chunk)
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
  createPastebin: createPastebin
}

if(module === process.mainModule) {
  createPastebin(apiKey, 'testing', function (err, paste) {
    console.log(err, paste)
  })
}
