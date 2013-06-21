var express = require('express')

var aug29 = +new Date(1314576000000)

var timeParts = [
  {name: 'day', seconds: 86400},
  {name: 'hour', seconds: 3600},
  {name: 'minute', seconds: 60}
]

var server = module.exports = express.createServer(
  express.bodyParser(),
  function(req, res, next) {
    if (req.method === 'POST') {
      var payload = req.body

      if (payload.text.indexOf('timeleft') === 0) {
        var left = Math.floor((aug29 - Date.now()) / 1000)
        if (left > 0) {
          var str = []
          timeParts.forEach(function(part) {
            if (left > part.seconds) {
              var t = Math.floor(left / part.seconds)
              str.push(t + ' ' + part.name + (t > 1 ? 's' : ''))
              left -= t * part.seconds
            }
          })
          str.push(left + ' second' + (left > 1 ? 's' : ''))

          res.json({speak: str.join(', ') + " left!"})
        } else {
          res.json({speak: "Times up!"})
        }
      } else if (payload.text.indexOf('payload') === 0) {
        res.json({paste: JSON.stringify(payload)})
      } else {
        res.json({speak: 'Unknown command'})
      }
    } else {
      next(new Error("only POST"))
    }
  }
)

if (require.main === module) {
  server.listen(8869)
  console.log("Listening on :8869")
}
