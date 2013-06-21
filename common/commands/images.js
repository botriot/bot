"use strict"

var _ = require('underscore')
  , credentials = require('../../settings').config.credentials
  , escapeRegex = require('../../common').escapeRegex
  , alias = require('../../common').alias
  , jsonHelper = require('../../common').jsonHelper
  , UserError = require('../../common/exceptions').UserError

var rages = require('./_rage-mappings')
  , sortedRages = Object.keys(rages).sort()

var all = {}

exports.fuckyeah = {
  description: 'gets an image from fuckyeahnouns.com using the given query',
  hidden: true,
  func: function (room, msg, options) {
    if (!msg) {
      return room.error(new UserError("You must provide some input. I can't read your mind."))
    }
    room.image("http://fuckyeahnouns.com/images/" + encodeURIComponent(msg.toLowerCase()).replace(/%20/g, '+'))
  }
}

exports.image = {
  description: 'Searches Google Images for the given input and returns the most relevant result. Use @<twitterusername> to get a user\'s twitter picture.',
  options: [
    ['-f, --face <overlay>', 'Apply face overlays to the image'],
    ['-u, --unsafe', 'Seach for unsafe results'],
  ],
  func: function(room, msg, options) {
    if (!msg) {
      return room.error(new UserError("You must provide some input. I can't read your mind."))
    }

    // the Send To Room method, we'll overrite if mustache is on
    var sendToRoom = function(msg) {
      room.image(msg)
    }

    // check for face flag
    if(options.face) {
      sendToRoom = function(msg) {
        room.image("http://faceup.me/img?overlay="+options.face+"&src=" + encodeURIComponent(msg).replace(/%20/g, '+'))
      }
    }

    // are we in strict or off mode
    var safe = 'strict'
    if(options.unsafe) {
      safe = 'off'
    }

    if (msg.match(/^https?:\/\//i)) {
      sendToRoom(msg)
    } else if (msg.match(/^\@/i)) {
      var uri = 'http://api.twitter.com/1/users/show.json?screen_name=' + encodeURIComponent(msg.toLowerCase())
      jsonHelper(room, uri, function(body) {
        sendToRoom(body.profile_image_url.replace("_normal",""))
      })
    } else {
      var uri = 'http://ajax.googleapis.com/ajax/services/search/images?v=1.0&safe=' + safe + '&q=' + encodeURIComponent(msg.toLowerCase())
      jsonHelper(room, uri, function(body) {
        if (body.responseData.results.length > 0) {
          sendToRoom(body.responseData.results[0].unescapedUrl)
        } else {
          room.speak("No image found :(")
        }
      })
    }
  }
}

exports.mustachify = {
  key: "mustachify",
  description: 'Add a mustache to anyone\'s face. <url> to pass an image directly to server. @<twittername> for a user\'s twitter picture. <google search> searches for a google image and applys the mustache to it.',
  func: function(room, args, options) {
    options.face = "mustache"
    return exports.image.func(room, args, options)
  }
}

exports.mustache = alias(exports.mustachify)

exports.clown = {
  key: "clown",
  description: 'Add a clown nose to anyone\'s face. <url> to pass an image directly to server. @<twittername> for a user\'s twitter picture. <google search> searches for a google image and applys the clown nose to it.',
  func: function(room, args, options) {
    options.face = "clown"
    return exports.image.func(room, args, options)
  }
}

exports.bozo = alias(exports.clown)

exports.hipster = {
  key: "hipster",
  description: 'Add hipster glasses to anyone\'s face. <url> to pass an image directly to server. @<twittername> for a user\'s twitter picture. <google search> searches for a google image and applys the hipster glasses to it.',
  func: function(room, args, options) {
    options.face = "hipster"
    return exports.image.func(room, args, options)
  }
}

exports.scumbag = {
  key: "scumbag",
  description: 'Add scumbag hat to anyone\'s face. <url> to pass an image directly to server. @<twittername> for a user\'s twitter picture. <google search> searches for a google image and applys the scumbag hat to it.',
  func: function(room, args, options) {
    options.face = "scumbag"
    return exports.image.func(room, args, options)
  }
}

exports.scum = alias(exports.scumbag)

exports.posterous = {
  description: 'Get a random image from a Posterous site.',
  func: function(room, msg, options) {
    if (!msg) {
      return room.error(new UserError("Provide a posterous site url"))
    }
    var uri = 'http://posterous.com/api/2/sites/'+encodeURIComponent(msg)+'/photos/public'
    jsonHelper(room, uri, function(body) {
      if (body.length > 0) {
        room.image(body[0]['full']['url'])
      } else {
        room.speak('No photos found')
      }
    })
  }
}

exports.tumblr = {
  description: 'Get a random image from a Tumblr site.',
  func: function(room, msg, options) {
    if (!msg) {
      return room.speak("Provide a tumblr site url like mr-gif.com or theeconomist.tumblr.com")
    }
    var uri = 'http://api.tumblr.com/v2/blog/'+encodeURIComponent(msg)+'/posts/photo?api_key=' + credentials.tumblr.apikey
    jsonHelper(room, uri, function(body) {
      if (body.response.posts.length === 0) {
        return room.speak('No Photos found.')
      }
      room.image(body.response.posts[Math.floor(Math.random() * body.response.posts.length)].photos[0].original_size.url)
    })
  }
}

exports.eyebleach = {
  description: 'When you just saw a horrifying image, use eyebleach to clear your mind.',
  options: [
    ['-g, --girl', 'Only girls'],
    ['-b, --boy', 'Only boys']
  ],
  func: function(room, args, options) {
    if(options.girl) {
      var num = Math.floor(Math.random() * 99) + 1
      if (num < 10) {
        num = '0' + num
      }
      room.image('http://www.eyebleach.com/eyebleach/eyebleach_0'+num+'.jpg')
    } else if(options.boy) {
      var num = Math.floor(Math.random() * 89) + 1
      if (num < 10) {
        num = '0' + num
      }
      room.image('http://guybleach.com/guybleach/eyebleach-0'+num+'.jpg')
    } else{
      var num = Math.floor(Math.random() * 19) + 1
      if (num==15) num++
      room.image('http://kidbleach.com/images/'+num+'.jpg')
    }
  }
}

_.each(rages, function(rage, rageName) {
  _.each(rage, function(image, alias) {
    all[alias] = image
  })
})

_.each(all, function(image, rage) {
  var command = {
    key: "rage",
    hidden: true,
    func: function(room, msg) {
      room.image("https://s3.amazonaws.com/trollicons/" + encodeURIComponent(image))
    }
  }

  exports[escapeRegex(rage)] = command
})

exports.rage = {
  description: 'Rage comics. Use !ragelist to see available images. (based https://github.com/sagargp/trollicons/)',
  func: function(room, msg, options) {
    var rage = msg.split(/\s+/).filter(function(word) {
      return all[word.toLowerCase()]
    })[0]
    if (!rage) {
      rage = 'rage'
    }
    room.image("https://s3.amazonaws.com/trollicons/" + encodeURIComponent(all[rage]))
  }
}

exports.ragelist = {
  description: 'Show list of rage images',
  func: function(room, args, options) {
    var list = sortedRages.map(function(name) {
      return name + ": [" + Object.keys(rages[name]).join(", ") + "]"
    })
    room.paste(list.join("\n"))
  }
}

exports.pinterest = {
  description: 'Returns popular pintrest.com images.',
  func: function(room, msg, options) {
    var uri = 'https://api.pinterest.com/v2/popular/'
    jsonHelper(room, uri, function(body) {
      if (body.pins.length === 0) {
        return room.speak('No Pins found.')
      }
      var random_pin = body.pins[Math.floor(Math.random() * body.pins.length)]
      room.speak([
        random_pin.images.closeup,
        random_pin.description + " " + random_pin.counts.likes + " likes"
      ])
    })
  }
}

exports.pin = alias(exports.pinterest)
