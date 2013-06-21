"use strict"

var jsonHelper = require('../../common').jsonHelper
  , httpHelper = require('../../common').httpHelper
  , credentials = require('../../settings').config.credentials
  , alias = require('../../common').alias
  , UserError = require('../../common/exceptions').UserError
  , request = require('request')
  
exports.twitter = {
  description: 'Searches Twitter for the given input and returns the first tweet.',
  options: [
    ['-t, --team', 'Show the number of followers for each member of a team (e.g !twitter -t @simplegeo/team)']
  ],
  func: function(room, msg, options) {
    if(options.team) {
      var params = msg.toLowerCase().split("/");
      if(params.length!=2) {
        return room.error(new UserError("Must specify a list path like @simplegeo/team"))
      }
      var uri = 'https://api.twitter.com/1/lists/members.json?slug='+params[1]+'&owner_screen_name='+params[0].replace("@","");
      var users = [];
      var speakList = function() {
            users.sort(function(a,b){return b.followers_count - a.followers_count})
            var empls = "";
            var last_count = 0;
            var last_name = "";
            var limit = 100;
            var n = 1;
            for(var i = 0; i < users.length; i++) {
              if(users[i].name==last_name) {
                  limit++;
              } else {
                  empls += "#"+ n + " " + users[i].name + " " + users[i].followers_count + " followers" + (last_count>0?" - " + (last_count - users[i].followers_count) + " to go\n":"\n");
                  last_name = users[i].name;
                  last_count = users[i].followers_count;
                  n++;
              }
            }
            room.paste(empls);
      }
      var getListMembers = function(cursor) {
        jsonHelper(room, uri + "&cursor="+cursor, function(body) {
          if (body.users && body.users.length > 0) {
              users = users.concat(body.users);
              if (body.next_cursor > 0) {
                  getListMembers(body.next_cursor);
              } else {
                  speakList();
              }
          } else {
              return room.error(new UserError("Fail Whale. :("))
          }
        })
      }
      getListMembers(-1);
    } else {
      if (!msg) {
        return room.error(new UserError("You must provide some input. I can't read your mind."))
      }
      var uri = 'http://search.twitter.com/search.json?rpp=1&result_type=recent&q=' + encodeURIComponent(msg)
      jsonHelper(room, uri, function(body) {
        if (body.results.length > 0) {
          room.speak("https://twitter.com/"+body.results[0].from_user+"/status/"+body.results[0].id_str)
        } else {
          room.speak("No tweet found :(")
        }
      })
    }
  }
}

exports.wiki = {
  description: 'Searches Wikipedia.org for the given input and returns a link to the most relevant article.',
  func: function (room, msg, options) {
    if (!msg) {
      return room.error(new UserError("You must provide some input. I can't read your mind."))
    }

    var uri = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + encodeURIComponent(msg) + '&format=json'
    jsonHelper(room, uri, function(body) {
      if (body[1].length > 0) {
        var key = body[1][0]
        room.speak("http://en.wikipedia.org/wiki/"+encodeURIComponent(key))
      } else {
        room.speak("No wikipedia article found")
      }
    })
  }
}

exports.answer = {
  description: 'Search Yahoo Answers for some answers.',
  func: function(room, msg, options) {
    var uri = "http://answers.yahooapis.com/AnswersService/V1/questionSearch?query=" + encodeURIComponent(msg) + "&start=0&results=1&appid=" + credentials.yahoo.appid + "&output=json"
    jsonHelper(room, uri, function(body) {
      if(body.all.count == 0) {
        return room.speak("No answers found.")
      }
      var question = body.all.questions[0]
      room.speak([
        "Q: " + question.Subject,
        "A: " + question.ChosenAnswer
      ])
    })
  }
}

exports.google = {
  description: 'Return the first result from google. Like I\'m feeling lucky.',
  func: function(room, msg) {
    httpHelper(room, 'http://www.google.com/search?q=' + encodeURIComponent(msg), function(body) {
      if(body.match(/<a href="([^"]*)" class=l/).length==0)
        return room.speak("Nothing found.")
      room.speak(body.match(/<a href="([^"]*)" class=l/)[0].match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)[0])
    })
  }
}

exports.npm = {
  description: 'Searches http://search.npmjs.org/ and returns the package best match.',
  func: function(room, msg) {
    jsonHelper(room, 'http://search.npmjs.org/_list/search/search?limit=25&startkey=%22' + encodeURIComponent(msg) + '%22&endkey=%22' + encodeURIComponent(msg) + 'ZZZZZZZZZZZZZZZZZZZ%22', function(body) {
      if(body.rows.length==0) return room.speak("No node package found.")
      var pack = body.rows[0]
      var url = pack.value.repository.url
      if(pack.value.repository.type=="git") {
        url = url.replace("git:","http:").replace(/\.git$/,"")
      }
      room.speak([pack.key + " v." + pack.value['dist-tags'].latest + " " + url,
      pack.value.description])
    })
  }
}

exports.pypi = {
  description: 'Get\'s info on a python package.',
  func: function(room, msg) {
    jsonHelper(room, 'http://pypi.python.org/pypi/' + encodeURIComponent(msg) + '/json', function(body) {
      if(!body) return room.speak("No package found.")
      room.speak([body.info.name + " v." + body.info.version + " " + body.info.home_page,
      body.info.summary])
    })
  }
}

exports.gems = {
  description: 'Searches rubygems.org for gem info',
  func: function(room, msg) {
    jsonHelper(room, 'https://rubygems.org/api/v1/search.json?query=' + encodeURIComponent(msg), function(body) {
      if(body.length == 0) return room.speak("No gem found.")
      var gem = body[0]
      room.speak([gem.name + " v." + gem.version + " " + gem.homepage_uri,
      gem.info])
    })
  }
}

exports.domain = {
  description: 'Check if a domain name if available.',
  func: function(room, msg) {
    request({uri: "https://dnsimple.com/domains/" + encodeURIComponent(msg) + "/check", headers:{ 'Accept': 'application/json', "Authorization":'Basic ' + new Buffer(credentials.dnsimple.username + ':' + credentials.dnsimple.password).toString('base64') }}, function(err, res, body) {
      var result = JSON.parse(body)
      room.speak(result.name + " is " + result.status)
    })
  }
}

exports.say = {
  key: 'say',
  description: 'Gives your bot, the power of speech. Ask it to speak a phrase and it will return the audio.',
  func: function(room, msg) {
    httpHelper(room, 'http://api.microsofttranslator.com/V2/Ajax.svc/GetLanguagesForSpeak?appId=' + credentials.microsoft.apikey, function(body) {
      langs = eval(body)
      httpHelper(room, 'http://api.microsofttranslator.com/V2/Ajax.svc/Detect?appId=' + credentials.microsoft.apikey + "&text=" + encodeURIComponent(msg), function(body) {
        if (langs.indexOf(eval(body)) == -1) return room.speak("Sorry, I can't speak '" + msg + "'")
        lang = eval(body)
        httpHelper(room, 'http://api.microsofttranslator.com/V2/Ajax.svc/Speak?appId=' + credentials.microsoft.apikey + "&text=" + encodeURIComponent(msg) + "&language=" + lang + "&format=audio/wav", function(body) {
          room.speak(eval(body)+"#.wav")
        })
      })
    })
  }
}

exports['speak'] = alias(exports.say)
