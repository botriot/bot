"use strict"

var credentials = require('../../settings').config.credentials
  , URL = require('url')
  , alias = require('../../common').alias
  , jsonHelper = require('../../common').jsonHelper
  , UserError = require('../../common/exceptions').UserError

exports.movie = {
  description: 'Gets movie information from Rotten Tomatoes.',
  options: [
    ['-t, --theaters', 'List the movies in theaters']
  ],
  func: function(room, msg, options) {
    if(options.title) {
      var uri = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json?apikey=' + credentials.rottentomatoes.apikey
      jsonHelper(room, uri, function(body) {
        var movies = body['movies']
          , movieList = ''
        movies.forEach(function(movie) {
          movieList += movie['title'] + '\n'
        })
        room.paste(movieList)
      })
    } else {
      var uri = 'http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=' + credentials.rottentomatoes.apikey + '&q=' + encodeURIComponent(msg)
      jsonHelper(room, uri, function(body) {
        var movie = body['movies'][0]
        room.speak([
          movie['title'] + ' (' + movie['mpaa_rating'] + ') - Filmed in ' + movie['year'] + ' starring ' + movie['abridged_cast'][0]['name'],
          movie['posters']['original'],
          movie['synopsis']
        ])
      })
    }

  }
}

exports.youtube = {
  description: 'Searches Youtube for the given input and returns the most relevant video.',
  func: function (room, msg, options) {
    if (!msg) {
      return room.error(new UserError("You must provide some input. I can't read your mind."))
    }
    var uri = 'https://gdata.youtube.com/feeds/api/videos?v=2&alt=json&max-results=1&q=' + encodeURIComponent(msg)
    jsonHelper(room, uri, function(body) {
      // 'https://gdata.youtube.com/feeds/api/videos/'+body.feed.entry[0].media$group.yt$videoid.$t+'?v=2&alt=json'
      // jsonHelper(room, body.feed.entry[0].gd$comments.gd$feedLink.href + "&alt=json" , function(meta) {
        if (body.feed.entry.length > 0) {
          room.speak([
            body.feed.entry[0].media$group.media$title.$t,
            "https://www.youtube.com/watch?v="+body.feed.entry[0].media$group.yt$videoid.$t+"&feature=youtube_gdata"
          ])
        } else {
          room.speak("No video found :(")
        }
      // })
    })
  },
  fullmessage: function (room, msg, extras) {
    var parsed = URL.parse(msg)
    if(/^http(s?):\/\/(?:www\.)?youtube.com\/watch\?(?=.*v=\w+)(?:\S+)?$/i.test(msg.replace(parsed.hash,""))) {
      var vvv = msg.split("v=")[1]
      var vid = vvv.substr(0, vvv.indexOf("&") || null)
      jsonHelper(room, "https://gdata.youtube.com/feeds/api/videos/" + (vid || vvv) + "?v=2&alt=json" , function(meta) {
        if (meta.entry) {
          room.speak([
            meta.entry.title.$t
          ])
        }
      })
    }
  }
}

exports.vimeo = {
  description: 'Fetches meta data about a vimeo video.',
  hidden: true,
  func: function (room, msg, options) {

  },
  fullmessage: function (room, msg, extras) {
    var parsed = URL.parse(msg)
    if(/^http:\/\/vimeo.com\/[0-9]+$/i.test(msg.replace(parsed.hash,""))) {
      var vid = msg.replace("http://vimeo.com/","")
      jsonHelper(room, "http://vimeo.com/api/v2/video/" + vid + ".json" , function(meta) {
        if (meta.length>0) {
          room.speak([
            meta[0].title,
            meta[0].thumbnail_large
          ])
        }
      })
    }
  }
}

