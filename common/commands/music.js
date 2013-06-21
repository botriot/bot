"use strict"

var async = require('async')
  , credentials = require('../../settings').config.credentials
  , jsonHelper = require('../../common').jsonHelper
  , settings = require('../../settings')
  , logger = settings.logger(module)

exports.lastfm = {
  description: 'Show what songs your team is listening to.',
  commands: {
    'register <username>': {
      admin: true,
      description: 'register a user',
      func: function(room, msg, options) {
        var username = msg
        room.getConfig(function(err, config) {
          var usernames = config.usernames || []
          if (!usernames.some(function(e) { return e === username })) {
            usernames.push(username)
          }
          config.usernames = usernames
          room.setConfig(config, function(err) {
            if (err) return room.error(err)
            room.speak(usernames.join(' '))
          })
        })
      }
    },

    'reset' : {
      admin: true,
      description: 'reset all the lastfm settings',
      func: function(room, msg, options) {
        room.setConfig({}, function(err) {
          if (err) return room.error(err)
          room.speak('lastfm reset')
        })
      }
    },

    'remove <username>': {
      admin: true,
      description: 'remove a user',
      func: function(room, msg, options) {
        var username = msg
        room.getConfig(function(err, config) {
          var usernames = config.usernames || config
          if (!usernames) usernames = []
          config.usernames = usernames.filter(function(e) { return e !== username })
          room.setConfig(config, function(err) {
            if (err) return room.error(err)
            room.speak(usernames.join(' '))
          })
        })
      }
    },

    'list': {
      description: 'list all the registered users',
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {
          var usernames = config.usernames || ['no-one is registered']
          room.speak(usernames.join(' '))
        })
      }
    },

    '*': {
      func: function(room, msg, options) {
        room.getConfig(function(err, config) {
          var usernames = config.usernames || []
          function fetch(username, callback) {
            jsonHelper(room, 'http://ws.audioscrobbler.com/2.0/?format=json&method=user.getrecenttracks&user='+encodeURIComponent(username)+'&limit=1&api_key=' + credentials.lastfm.apikey, function(body) {
              if (!body) return callback(null, null)
              var track = body.recenttracks.track && body.recenttracks.track[0]
              if (track && track['@attr'] && track['@attr'].nowplaying === 'true') {
                callback(null, username + ": " + track.artist['#text'] + ": " + track.name)
              } else {
                // callback(null, username + " is not listening to anything")
                callback(null, null)
              }
            })
          }

          if (usernames && usernames.length > 0) {
            usernames.sort()
            async.map(usernames, fetch, function(err, songs) {
              if (err) return room.error(err)

              songs = songs.filter(function(e) { return e })
              if (songs.length) {
                room.paste(songs.join('\n'))
              } else {
                room.speak('no-one is listening to anything :(')
              }
            })
          } else {
            room.speak('no-one registered')
          }
        })
      }
    }
  }
}

exports.lyric = {
  description: 'Searches for the given song, and returns a random lyric',
  func: function(room, msg, options) {
    if(msg.replace(/\s/g,'')=='') {
      return room.speak('You must specify a song, artist or lyric')
    }
    var track_search_uri = 'http://api.musixmatch.com/ws/1.1/track.search?apikey=' + credentials.musixmatch.apikey + '&format=json&q=' + encodeURIComponent(msg)
    jsonHelper(room, track_search_uri, function(body) {
      var track_list = body['message']['body']['track_list'];
      if(track_list.length>0) {
        var track = track_list[0]
        var lyrics_uri = 'http://api.musixmatch.com/ws/1.1/track.lyrics.get?format=json&apikey=' + credentials.musixmatch.apikey + '&track_id=' + track['track']['track_id']
        jsonHelper(room, lyrics_uri, function(body) {
          if (body['message']['header']['status_code']==404) {
            return room.speak('Lyrics not found.')
          }
          var lyrics_body = body['message']['body']['lyrics']['lyrics_body']
          lyrics_body = lyrics_body
                .replace(/\n\s*\n/g, "\n")
                .replace('******* This Lyrics is NOT for Commercial use *******','')
                .replace(/\n.+\.\.\.\n/,"")
                .replace(/\r/g,'')
          var lines = lyrics_body.split(/\n/)
          var line = lines[Math.floor(Math.random()*lines.length)]
          room.speak("\""+ line + "\" " + track['track']['track_name'] + " by " + track['track']['artist_name'])
        })
      } else {
        room.speak('Song not found.')
      }
    })
  }
}

exports.play = {
  description: 'Searches iTunes for a song, and plays a preview',
  func: function(room, msg, options) {
    if(msg.replace(/\s/g,'')=='') {
      return room.speak('You must specify a song, artist')
    }
    var track_search_uri = 'http://itunes.apple.com/search?entity=song&limit=1&term=' + encodeURIComponent(msg)
    jsonHelper(room, track_search_uri, function(body) {
      if(body.resultCount==1) {
        var song = body.results[0]
        room.speak([
          song.artworkUrl100,
          song.trackName + " - " + song.artistName,
          song.previewUrl
        ])
      } else {
        room.speak('Song not found.')
      }
    })
  }
}
