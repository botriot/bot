"use strict"

var brain = require("brain")
  , settings = require('../../settings')
  , client = require('../../settings').redis
  
var bayes = new brain.BayesianClassifier({
    backend: {
        type: "redis",
        options: {
            hostname: settings.redis.host,
            port: settings.redis.port,
            name: 'scottbot'
        }
    },
    thresholds: {
        funny: 3,
        notfunny: 1
    },
    def: "notfunny"
});


exports.twss = {
  description: 'Training for that\'s what she said.\n'+
  'If your bot makes an innapropriate joke, you can say "!twss no" and it will train the previous statement as unfunny.\n'+
  'To specifically train a word, use !twss "it was really hard" is funny',
  func: function (room, msg, options) {
    if (!msg) {
      room.speak("Train with no, to specify the last line as not funny.")
      return
    }
    client.get(room.bot.config._id+"lastline",function(err,value) {
      if (err) return room.error(err)
      var lastline = value.replace(/[^a-z\s]/gi,"")
      if (msg.match(/no/i)) {
        client.get(room.bot.config._id+"lastfunny",function(err,value) {
          lastline = value.replace(/[^a-z\s]/gi,"")
          if (lastline) {
            bayes.train(lastline, "notfunny", function() {
              room.speak("sorry :(");
            });
          }
        })
      } else if (msg.match(/".*" is not funny/i)) {
        phrase = msg.match(/".*"/i)[0].slice(1, -1);
        phrase = phrase.replace(/[^a-z\s]/gi,"")
        bayes.train(phrase, "notfunny", function() {
          room.speak("ok!");
        });
      }
    })
  },
  fullmessage: function (room, msg, extras) {
    if (msg.match(/^https?:\/\//i)) {
      return
    }
    client.set(room.bot.config._id+"lastline", msg, function(err,value){})
    bayes.classify(msg, function(category) {
      if (category == "funny") {
        client.set(room.bot.config._id+"lastfunny", msg, function(err,value){})
        room.speak("that's what she said");
      }
    });
  }
}
