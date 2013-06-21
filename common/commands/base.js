"use strict"

var URL = require('url')
  , client = require('../../settings').redis
  , _ = require('underscore')
  , credentials = require('../../settings').config.credentials
  , alias = require('../../common').alias
  , prettyDate = require('../../common').prettyDate
  , ISODateString = require('../../common').ISODateString
  , httpHelper = require('../../common').httpHelper
  , jsonHelper = require('../../common').jsonHelper
  , async = require('async')
  , settings = require('../../settings')
  , logger = settings.logger(module)
  , jsdom = require("jsdom")
  , xml2js = require('xml2js')

exports.admin = {
  key: "admin",
  admin: true,
  description: 'Check if you have admin.',
  func: function(room, msg) {
    room.speak("What is thy bidding master?");
  }
}

exports.translate = {
  key: "translate",
  description: 'Translates a phrase into english',
  func: function(room, msg) {
    httpHelper(room, 'http://translate.google.com/translate_a/t?client=t&hl=en&multires=1&sc=1&sl=auto&ssel=0&tl=en&tsel=0&uptl=en&text=' + encodeURIComponent(msg), function(body) {
      if (body.length > 4 && body[0] == '[') {
        parsed = eval("("+body+")")
        parsed = parsed[0] && parsed[0][0] && parsed[0][0][0]
        if (parsed) {
          return room.speak(parsed)
        }
      }
      room.speak("No translation.")
    })
  }
}

exports.math = {
  key: "math",
  description: 'Computates, most calculations. Math and convert.',
  func: function(room, msg) {
    httpHelper(room, 'http://www.google.com/ig/calculator?hl=en&q=' + encodeURIComponent(msg), function(body) {
      json = eval("("+body+")")
      room.speak(json.rhs || "Can not compute. gerror gerror")
    })
  }
}
exports['convert'] = alias(exports.math)
exports['calc'] = alias(exports.math)
exports['calculate'] = alias(exports.math)


exports.define = {
  description: 'Searches Wordnik for the top 3 definitions of the supplied word.',
  options: [
    ['-u, --urban', 'Search through urban dictionary']
  ],
  func: function(room, msg, options) {
    if (!msg) {
      room.speak("You must provide a word.")
      return
    }
    if(options.urban) {
      var uri = 'http://www.urbandictionary.com/iphone/search/define?term=' + encodeURIComponent(msg)
      jsonHelper(room, uri, function(body) {
        var results = []
        var counter = 1
        if (body.list && body.list.length > 0) {
          var definitions = body.list.slice(0,3)
          definitions.forEach(function(res) {
            results.push(counter + '. ' + res['definition'])
            ++counter
          })
          room.speak(results)
        } else {
          room.speak("No definition found.")
        }
      })
    } else {
      var uri = 'http://api.wordnik.com/v4/word.json/' + encodeURIComponent(msg) + '/definitions?api_key=' + credentials.wordnik.apikey + '&limit=3'
      jsonHelper(room, uri, function(body) {
        var results = []
        var counter = 1
        if (body.length > 0) {
          body.forEach(function(definition) {
            results.push(counter + '. ' + definition['text'])
            ++counter
          })
        }
        if (results.length > 0) {
          room.speak(results)
        } else {
          room.speak("No definition found.")
        }
      })
    }
  }
}

exports.relate = {
  description: 'Searches Wordnik\'s thesaurus for words that are similar to the supplied word.',
  options: [
    ['-u, --urban', 'Search Urban Dictionary']
  ],
  func: function(room, msg, options) {
    if (!msg) {
      room.speak("You must provide a word.")
      return
    }
    if(options.urban) {
      var uri = 'http://www.urbandictionary.com/iphone/search/related?term=' + encodeURIComponent(msg)
      httpHelper(room, uri, function(body) {
        if (body.related && body.related.length > 0) {
          var words = body['related']
            , response = msg.text + ' is related to the following words: '
          words.forEach(function(word) {
            response += word + ', '
          })
          room.speak(response.substr(0, response.length-2))
        } else {
          room.speak("No like words found.")
        }
      })
    } else {
      var uri = 'http://api.wordnik.com/v4/word.json/' + encodeURIComponent(msg) + '/related?api_key=' + credentials.wordnik.apikey
      jsonHelper(room, uri, function(body) {
        if (body.length > 0) {
          var words = body[0]['words']
            , response = msg + ' is a ' + body[0]['relationshipType'] + ' of the following words: '
          words.forEach(function(word) {
            response += word + ', '
          })
          room.speak(response.substr(0, response.length-2))
        } else {
          room.speak("No like words found.")
        }
      })
    }
  }
}

exports.curl = {
  description: 'Send a GET request to a URL.',
  func: function(room, msg, options) {
    httpHelper(room, msg, function(body) {
      room.paste(body)
    })
  }
}

exports.stock = {
  description: 'Get\'s a stock quote for the passed in symbol',
  func: function(room, msg, options) {
    if (!msg) {
      return room.speak("Please supply a stock symbol, like AAPL")
    }
    msg = msg.split(" ")
    var uri = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20google.igoogle.stock%20where%20stock%3D'" + encodeURIComponent(msg[0]) + "'%3B&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys"
    jsonHelper(room, uri, function(body) {
      var finance = body.query.results.xml_api_reply.finance
      if(!finance || !finance.company || finance.company.data == "") {
        return room.speak("Cannot find symbol.")
      }
      var time = (msg.length > 1?msg[1]:"1d")
      room.speak([
        finance.company.data + ": " + finance.symbol.data,
        finance.last.data + " " + finance.change.data + " (" + finance.perc_change.data + "%)",
        "http://chart.finance.yahoo.com/z?s=" + msg + "&t=" + time + "&q=l&l=on&z=l&a=v&p=s&lang=en-US&region=US#.png"
      ])
    })
  }
}

exports.commitmessage = {
  description: 'pulls a random commit message from whatthecommit.com',
  func: function(room, msg, options) {
    var uri = 'http://whatthecommit.com/index.txt'
    httpHelper(room, uri, function(body) {
      room.speak(body)
    })
  }
}

exports.ascii = {
  description: 'Returns the given text in ascii',
  func: function(room, msg, options) {
    var uri = 'http://asciime.heroku.com/generate_ascii?s=' + encodeURIComponent(msg)
    httpHelper(room, uri, function(body) {
      room.paste(body)
    })
  }
}

var linkType = function(url) {

  var parsed = URL.parse(url)

  // URL is an image
  if (/\.(?:jpg|png|gif)$/i.test(url.replace(parsed.hash,""))) {
    return "image"
  }

  // URL is youtube
  if(/^http:\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/i.test(url.replace(parsed.hash,""))) {
    return "video"
  }

  // URL is twitter
  if(/^https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)$/i.test(url)) {
    return "tweet"
  }

  return false
}

// TODO: Figure out how to convert this command on
// over to commander
exports.archive = {
  description: 'Keep track of images, youtube videos, and tweets. When someone re-posts the same content, you better believe we call them out. !disable archive to turn off.',
  commands: {
    // TODO: refactor these two commands, lots of shared logic
    'video': {
      description: 'Returns a random video from the archive.',
      func: function(room, msg, options) {
        client.get(room.bot.config._id+"urls",function(err,value) {
          if(value) {
            var links = JSON.parse(value)
            var keys = _.keys(links)
            // randomize the array
            keys.sort(function() {return 0.5 - Math.random()})
            for(var i in keys) {
              if(linkType(keys[i])=="video") {
                return room.speak([
                  keys[i],
                  "Shared by " + links[keys[i]].name + " " + prettyDate(links[keys[i]].date)
                ])
              }
            }
            room.speak("No videos in the archive.")
          }
        })
      }
    },
    'image': {
      description: 'Returns a random image from the archive.',
      func: function(room, msg, options) {
        client.get(room.bot.config._id+"urls",function(err,value) {
          if(value) {
            var links = JSON.parse(value)
            var keys = _.keys(links)
            // randomize the array
            keys.sort(function() {return 0.5 - Math.random()})
            for(var i in keys) {
              if(linkType(keys[i])=="image") {
                return room.speak([
                  keys[i],
                  "Shared by " + links[keys[i]].name + " " + prettyDate(links[keys[i]].date)
                ])
              }
            }
            room.speak("No images in the archive.")
          }
        })
      }
    },
    'tweet': {
      description: 'Returns a random tweet from the archive.',
      func: function(room, msg, options) {
        client.get(room.bot.config._id+"urls",function(err,value) {
          if(value) {
            var links = JSON.parse(value)
            var keys = _.keys(links)
            // randomize the array
            keys.sort(function() {return 0.5 - Math.random()})
            for(var i in keys) {
              if(linkType(keys[i])=="tweet") {
                return room.speak([
                  keys[i],
                  "Shared by " + links[keys[i]].name + " " + prettyDate(links[keys[i]].date)
                ])
              }
            }
            room.speak("No tweets in the archive.")
          }
        })
      }
    }
  },
  fullmessage: function(room, msg, extras) {

    var match = msg.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)
    if (match) {
      var determinedupe = function() {
        match.forEach(function(url) {
          if(!linkType(url)) return

          // TODO: is this key good enough?
          client.get(room.bot.config._id+"urls",function(err,value) {
            if(value) {
              var urls = JSON.parse(value)
              if(urls[url]) {
                if(extras.from.id) {
                  if(extras.from.id==urls[url].id) {
                    return
                  }
                } else {
                  if(extras.from.name==urls[url].name) {
                    return
                  }
                }
                room.speak("Old! " + urls[url].name + " shared this link first " + prettyDate(urls[url].date))
              } else {
                urls[url] = { date:extras.date, name: extras.from.name, id: extras.from.id }
                client.set(room.bot.config._id+"urls", JSON.stringify(urls), function(err,value){})
              }
            } else {
              var urls = {}
              urls[url] = { date:extras.date, name:extras.from.name, id: extras.from.id }
              client.set(room.bot.config._id+"urls", JSON.stringify(urls), function(err,value){})
            }
          })
        })
      }
      if(extras.from.name != null) {
        determinedupe()
      } else {
        room.users(function (users) {
          users.forEach(function(user) {
            if(user.id==extras.from.id) {
              extras.from.name = user.name
              determinedupe()
            }
          })
        })
      }
    }
  }
}

exports.pivot = {
  description: 'returns a great idea for a company direction pivot (uses the itsthisforthat.com API)',
  func: function(room, msg, options) {
    var uri = 'http://itsthisforthat.com/api.php?json'
    jsonHelper(room, uri, function(body) {
      room.speak('How about "the ' + body.this + ' for ' + body.that + '"?')
    })
  }
}

exports.weather = {
  description: 'weather for the given zip code.',
  options: [
    ['-f --forecast', 'Get the 3-day forecast']
  ],
  func: function(room, msg, options) {
    if (!msg) {
      room.speak("Please give me an address or zip code.")
      return
    }
    var uri = 'http://www.google.com/ig/api?weather='+encodeURIComponent(msg)
    httpHelper(room, uri, function(body) {
      var parser = new xml2js.Parser();
      parser.parseString(body, function (err, result) {
        if(options.forecast) {
          var forecast = result.weather.forecast_conditions
          room.speak([
            'Forecast for ' + result.weather.forecast_information.city['@'].data,
            'Today: ' + forecast[0].condition['@'].data + ' with a low of ' + forecast[0].low['@'].data + '°F and a high of ' + forecast[0].high['@'].data + '°F',
            'Tonight: ' + forecast[1].condition['@'].data + ' with a low of ' + forecast[1].low['@'].data + '°F and a high of ' + forecast[1].high['@'].data + '°F',
            'Tomorrow: ' + forecast[2].condition['@'].data + ' with a low of ' + forecast[2].low['@'].data + '°F and a high of ' + forecast[2].high['@'].data + '°F'
          ])
        } else {
          var current = result.weather.current_conditions
          room.speak('It\'s currently ' + current.condition['@'].data + ' and ' + current.temp_f['@'].data + '°F. With a ' + current.humidity['@'].data + ' and ' + current.wind_condition['@'].data + ' in ' + result.weather.forecast_information.city['@'].data)
        }
      });
    })
  }
}

exports.forecast = {
  description: 'Get the 3-day forecast for the given zip code.',
  func: function(room, args, options) {
    options.forecast = true
    return exports.weather.func(room, args, options)
  }
}

exports.flip = {
  description: 'flips a coin',
  func: function(room, msg, options) {
    room.speak(Math.random() > 0.5 ? "Heads!" : "Tails!")
  }
}

exports.roll = {
  description: 'rolls a dice, if no size specified will use a 6-sided die',
  func: function (room, msg, options) {
    var size = 6
    if (msg) {
      size = parseInt(options.args[0])
      if (!size) {
        return room.speak("That's not a valid number")
      }
    }

    var roll = Math.floor(Math.random() * size) + 1
    room.speak("Rolled a " + size + "-sided die: " + roll)
  }
}

exports.eightball = {
  key: 'eightball',
  description: 'Magic 8 ball',
  func: function(room, msg, options) {
    var txts = [
      'It is certain.',
      'It is decidedly so.',
      'Without a doubt.',
      'Yes - definitely.',
      'You may rely on it.',
      'As I see it, yes.',
      'Most likely.',
      'Outlook good.',
      'Signs point to yes.',
      'Yes.',
      'Reply hazy, try again.',
      'Ask again later.',
      'Better not tell you now.',
      'Cannot predict now.',
      'Concentrate and ask again.',
      'Don\'t count on it.',
      'My reply is no.',
      'My sources say no.',
      'Outlook not so good.',
      'Very doubtful.'
    ]
    room.speak(txts[Math.floor(Math.random()*txts.length)])
  }
}

exports['8ball'] = alias(exports.eightball)

exports.spin = {
  description: 'selects a user from the room at random',
  func: function(room, msg, options) {
    room.users(function (users) {
      room.speak(users[Math.floor(Math.random()*users.length)].name)
    })
  }
}


var adjective1 = [
  'artless', 'bawdy', 'beslubbering', 'bootless',
  'brazen', 'churlish', 'cockered', 'clouted', 'craven', 'currish',
  'dankish', 'dissembling', 'distempered', 'droning', 'errant', 'fawning',
  'fitful', 'fobbing', 'froward', 'frothy', 'gleeking', 'gnarling',
  'goatish', 'gorbellied', 'greasy', 'grizzled', 'haughty', 'hideous',
  'impertinent', 'infectious', 'jaded', 'jarring', 'knavish', 'lewd',
  'loggerheaded', 'lumpish', 'mammering', 'mangled', 'mewling', 'paunchy',
  'peevish', 'pernicious', 'prating', 'pribbling', 'puking', 'puny',
  'purpled', 'quailing', 'queasy', 'rank', 'reeky', 'roguish', 'roynish',
  'ruttish', 'saucy', 'sottish', 'spleeny', 'spongy', 'surly', 'tottering',
  'unmuzzled', 'vacant', 'vain', 'venomed', 'villainous', 'waggish',
  'wanton', 'warped', 'wayward', 'weedy', 'wenching', 'whoreson', 'yeasty'
]

var adjective2 = [
  'base-court', 'bat-fowling', 'beef-witted',
  'beetle-headed', 'boil-brained', 'bunched-backed', 'clapper-clawed',
  'clay-brained', 'common-kissing', 'crook-pated', 'dismal-dreaming',
  'dizzy-eyed', 'dog-hearted', 'dread-bolted', 'earth-vexing',
  'elf-skinned', 'empty-hearted', 'evil-eyed', 'eye-offending',
  'fat-kidneyed', 'fen-sucked', 'flap-mouthed', 'fly-bitten',
  'folly-fallen', 'fool-born', 'full-gorged', 'guts-griping', 'half-faced',
  'hasty-witted', 'heavy-handed', 'hedge-born', 'hell-hated', 'horn-mad',
  'idle-headed', 'ill-breeding', 'ill-composed', 'ill-nurtured',
  'iron-witted', 'knotty-pated', 'lean-witted', 'lily-livered', 'mad-bread',
  'milk-livered', 'motley-minded', 'muddy-mettled', 'onion-eyed',
  'pale-hearted', 'paper-faced', 'pinch-spotted', 'plume-plucked',
  'pottle-deep', 'pox-marked', 'raw-boned', 'reeling-ripe', 'rough-hewn',
  'rude-growing', 'rug-headed', 'rump-fed', 'shag-eared', 'shard-borne',
  'sheep-biting', 'shrill-gorged', 'spur-galled', 'sour-faced',
  'swag-bellied', 'tardy-gaited', 'tickle-brained', 'toad-spotted',
  'unchin-snouted', 'weak-hinged', 'weather-bitten', 'white-livered'
]

var noun = [
  'apple-john', 'baggage', 'barnacle', 'bladder', 'boar-pig',
  'bugbear', 'bum-bailey', 'canker-blossom', 'clack-dish', 'clotpole',
  'coxcomb', 'codpiece', 'crutch', 'cutpurse', 'death-token', 'dewberry',
  'dogfish', 'egg-shell', 'flap-dragon', 'flax-wench', 'flirt-gill',
  'foot-licker', 'fustilarian', 'giglet', 'gudgeon', 'gull-catcher',
  'haggard', 'harpy', 'hedge-pig', 'hempseed', 'hedge-pig', 'horn-beast',
  'hugger-mugger', 'jack-a-nape', 'jolthead', 'lewdster', 'lout',
  'maggot-pie', 'malignancy', 'malkin', 'malt-worm', 'mammet', 'manikin',
  'measle', 'minimus', 'minnow', 'miscreant', 'moldwarp', 'mumble-news',
  'nut-hook', 'pantaloon', 'pigeon-egg', 'pignut', 'puttock', 'pumpion',
  'rabbit-sucker', 'rampallion', 'ratsbane', 'remnant', 'rudesby',
  'ruffian', 'scantling', 'scullion', 'scut', 'skainsmate', 'snipe',
  'strumpet', 'varlot', 'vassal', 'waterfly', 'whey-face', 'whipster',
  'wagtail', 'younker'
]

exports.curse = {
  description: "Insult in Elizabethan language (from: http://trevorstone.org/curse/ )",
  func: function(room, msg, options) {
    var curse = [
      adjective1[Math.floor(Math.random() * adjective1.length)],
      adjective2[Math.floor(Math.random() * adjective2.length)],
      noun[Math.floor(Math.random() * noun.length)] + '!'
    ]
    if (msg) {
      room.speak(msg + ", thou " + curse.join(' '))
    } else {
      room.speak("Thou " + curse.join(' '))
    }
  }
}

exports.echo = {
  description: "Echo back text",
  func: function(room, msg, options) {
    room.speak(msg)
  }
}

exports.jenkins = {
  description: "Jenkins related commands",
  commands: {
    'register <username> <password> <server>': {
      admin: true,
      description: 'register the jenkins user, pass in username password and server (ie. http://ci.jruby.org)',
      func: function(room, msg, options) {
        var username = options.args[0]
        var password = options.args[1]
        var server = options.args[2]
        room.setConfig({ username: username, password: password, server: server }, function(err) {
          if (err) return room.error(err)
          room.speak(username + "@" + server + " is registered.")
        })
      }
    },

    'reset' : {
      admin: true,
      description: 'reset all the jenkins settings',
      func: function(room, msg, options) {
        room.setConfig({}, function(err) {
          if (err) return room.error(err)
          room.speak('jenkins reset')
        })
      }
    },

    'status <job>': {
      description: 'get the status of the specified job',
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {
          if (!config) return room.speak('You must register your <username> <password> <jenkinsserver>')
          if (err) return room.error(err)
          jsonHelper(room, config.server+"/job/"+options.args[0]+"/api/json", "get", function(body) {
            room.speak([
              "Job: " + body.displayName + " " + body.url,
              body.healthReport[0].description,
              "Last Build: #" + body.lastBuild.number + " " + body.lastBuild.url
            ])
          },{ username: config.username, password:config.password })
        })
      }
    },
    'build <job>': {
      description: 'build a job',
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          if (!config) return room.speak('You must register your <username> <password> <jenkinsserver>')
          var jobname = options.args[0]
          httpHelper(room, config.server+"/job/"+jobname+"/build", "get", function(body) {
            room.speak(jobname + " has been built")
          },{ username: config.username, password:config.password })
        })
      }
    },
    'failed': {
      description: 'get the last failed builds',
      func: function(room, msg, options) {
        var sortByBuildTime = function(a,b) {
          if(!a.lastFailedBuild||!b.lastFailedBuild)
            return 0
          return (b.lastFailedBuild.timestamp - a.lastFailedBuild.timestamp)
        }

        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          if (!config) return room.speak('You must register your <username> <password> <jenkinsserver>')
          jsonHelper(room, config.server+"/api/json?tree=jobs[displayName,lastFailedBuild[number,url,timestamp,culprits[fullName],changeSet[items[author[fullName],comment]]],color]", "get", function(body) {
            var failed = ""
            body.jobs.sort(sortByBuildTime);
            for(var i in body.jobs) {
              var job = body.jobs[i];
              if(job.color=="red") {
                failed += job.displayName + " failed " + prettyDate(job.lastFailedBuild.timestamp) + "\n" + job.lastFailedBuild.url;
                if(job.lastFailedBuild.culprits.length > 0) {
                  failed +=  "\n" + job.lastFailedBuild.culprits[0].fullName
                  if(job.lastFailedBuild.changeSet.items.length > 0) {
                    failed += " - " + job.lastFailedBuild.changeSet.items[0].comment
                  }
                  failed += "\n"
                }
                failed += "\n\n"
              }
            }
            room.paste("Failed Builds:\n\n" + failed)
          },{ username: config.username, password:config.password })
        })
      }
    }
  }
}

exports.pagerduty = {
  description: "Retrieve on call schedules",
  commands: {

    'register <email> <password> <subdomain>': {
      admin: true,
      description: 'register a pagerduty user, pass in login email password and subdomain (ie. <your_subdomain>.pagerduty.com)',
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {
          if (err) return room.error(err)

          var creds = config.creds || {}

          creds['username'] = options.args[0]
          creds['password'] = options.args[1]
          creds['server'] = options.args[2]

          config.creds = creds

          room.setConfig(config, function(err) {
            if (err) return room.error(err)
            room.speak(creds['username'] + "@" + creds['server'] + " is registered.")
          })
        })
      }
    },

    'add': {
      admin: true,
      description: 'add a schedule id to check. find your schedule ids http://<subdomain>.pagerduty.com/schedule/rotations/<scheduleid>',
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {

          if (err) return room.error(err)
          if (options.args.length==0) return room.speak('find your schedule ids <subdomain>.pagerduty.com/schedule/rotations/<scheduleid>')
          if (!config.creds) return room.speak('You first need to register auth credentials')
          var sid = options.args[0]
          var schedules = config.schedules || []
          if (!schedules.some(function(e) { return e === sid })) {
            schedules.push(sid)
          }
          config.schedules = schedules

          room.setConfig(config, function(err) {
            if (err) return room.error(err)
            room.speak("Ok! " + options.args[0] + " has been added to the list. We currently have these schedules " + config.schedules.join(", ") + ".")
          })
        })
      }
    },

    'reset' : {
      admin: true,
      description: 'reset all the pagerduty settings',
      func: function(room, msg, options) {
        room.setConfig({}, function(err) {
          if (err) return room.error(err)
          room.speak('pagerduty reset')
        })
      }
    },

    'incidents' : {
      description: 'get list of open incidents',
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          var now = new Date()
          var since = ISODateString(new Date(now - 21600000))
          var until = ISODateString(now)
          jsonHelper(room, "https://"+config.creds.server+".pagerduty.com/api/v1/incidents?status=acknowledged,triggered&since="+since+"&until="+until, "get", function(body) {
            var paste = ""
            for(var i in body.incidents) {
              var inc = body.incidents[i]
              paste += "#"+inc.incident_number+": " + inc.trigger_summary_data.description + "\n" + (inc.status=="triggered"?"assigned to ":"acknowledged by ") + inc.assigned_to_user.name + " " + prettyDate(inc.created_on) + " " + inc.html_url + "\n\n"
            }
            if(body.incidents.length==0) {
              room.speak("No open incidents")
            } else {
              room.paste(paste)
            }
          },{ username: config.creds.username, password:config.creds.password })
        })
      }
    },

    'oncall': {
      description: 'find out who is on call right now',
      func: function(room, msg, options) {
        var now = new Date()
        var since = ISODateString(now)
        var until = ISODateString(now)
        room.getConfig(function(err, config) {
          if (err) return room.error(err)
          if (!config.schedules) return room.speak('You need to add a schedule to the config')

          function fetch(sid, callback) {
            jsonHelper(room, "https://"+config.creds.server+".pagerduty.com/api/v1/schedules/"+sid+"/entries?since="+since+"&until="+until, "get", function(body) {
              var users = []
              for(var i in body.entries) {
                users.push(body.entries[i].user.name)
              }
              callback(null, users.join(", "))
            },{ username: config.creds.username, password:config.creds.password })
          }

          async.map(config.schedules, fetch, function(err, users) {
            if (err) {
              logger.error(err)
              if (err) return room.error(err)
            }

            if (users.length) {
              room.speak(users.join(', '))
            } else {
              room.speak('no-one is on call')
            }
          })



        })
      }
    }
  }
}

exports.opengraph = {
  description: 'Returns any opengraph data from a shared url.',
  hidden: true,
  func: function (room, msg, options) {

  },
  fullmessage: function (room, msg, extras) {
    var parsed = URL.parse(msg)
    if(parsed.host) {
      jsdom.env(parsed.href, [
        'http://code.jquery.com/jquery-1.5.min.js'
      ],
      function(errors, window) {
        
        if (!window) return false;
        
        var og = window.$("meta[property='og:type']")
        if(og.length) {
          switch(og.attr("content")) {
            case "video":
            // don't do videos
            break;
            case "article":
              room.speak([
                window.$("meta[property='og:title']").attr("content"),
                window.$("meta[property='og:image']").attr("content")
              ])
            break;
            case "instapp:photo":
              room.speak([
                window.$("meta[property='og:description']").attr("content"),
                window.$("meta[property='og:image']").attr("content")
              ])
            break;
            case "githubog:gitrepository":
              room.speak([
                window.$("meta[property='og:description']").attr("content")
              ])
            break;
            default:
              room.speak([
                window.$("meta[property='og:title']").attr("content"),
                window.$("meta[property='og:image']").attr("content")
              ])
          }
        }
        window.close()
      });
    }
  }
}
