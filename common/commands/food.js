"use strict"

var _ = require('underscore')
  , credentials = require('../../settings').config.credentials
  , alias = require('../../common').alias
  , jsonHelper = require('../../common').jsonHelper
  , geocoder = require('geocoder')

exports.eat = {
  description: 'find a place to eat near your address, eg. !eat within 2 miles from San Francisco, CA',
  func: function(room, msg, options) {
    if (!msg) {
      return room.speak("Please give me an address or zip code.")
    }
    var msg2 = msg.toLowerCase().split("from")
    var address = msg
    var distance = "2.0"
    if(msg2.length > 1) {
      address = msg2.pop()
      distance = parseFloat(msg2.pop())
    }
    geocoder.geocode(address, function ( err, data ) {
      if(data.status!="OK") return room.speak("Error: " + data.status)
      var uri2 ='http://www.foodspotting.com/api/v1/sightings.json?latitude=' + data.results[0].geometry.location.lat + '&longitude=' + data.results[0].geometry.location.lng + '&sort=best&within='+ distance + '&per_page=40&api_key=' + credentials.foodspotting.apikey
      jsonHelper(room, uri2, function(body) {
        var features = body['data']['sightings']
        if (features.length == 0 || body['meta']['code'] != 200) {
          return room.speak('Can\'t find any place to eat near "'+msg+'".  Can you be more specific with your location?')
        }
        var selected = features[Math.floor(Math.random()*features.length)]
        room.speak([selected.current_review.thumb_590+"#.png", selected.item.name + " @ " + selected.place.name])
      })
    })
  }
}

exports.wheretoeat = alias(exports.eat)
