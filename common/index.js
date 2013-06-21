"use strict"

var _ = require('underscore')
  , request = require('request')

exports.escapeRegex = function(str) {
  return str.replace(/([.*+?|()\[\]{}\\])/g, '\\$1');
}

exports.alias = function(cmd, options) {
  return _.extend({}, cmd, {hidden: true}, options)
}

/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.
exports.prettyDate = function(time) {
    var date = new Date((time || "")),
    diff = (((new Date()).getTime() - date.getTime()) / 1000),
    day_diff = Math.floor(diff / 86400);

    if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
    return "";

    return day_diff == 0 && (
    diff < 60 && "just now" ||
    diff < 120 && "1 minute ago" ||
    diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
    diff < 7200 && "1 hour ago" ||
    diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
    day_diff == 1 && "Yesterday" ||
    day_diff < 7 && day_diff + " days ago" ||
    day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
}

exports.ISODateString = function(d) {
    function pad(n){
        return n < 10 ? '0'+n : n
    }
    return d.getUTCFullYear()+'-'
    + pad(d.getUTCMonth()+1)+'-'
    + pad(d.getUTCDate())+'T'
    + pad(d.getUTCHours())+':'
    + pad(d.getUTCMinutes())+':'
    + pad(d.getUTCSeconds())+'Z'
}

var httpMethodMap = {
  'get': request.get,
  'put': request.put,
  'post': request.post,
  'del': request.del
}

// TODO These methods need to be changed up a bit when we allow POST/PUT/DELETE with payloads.

exports.jsonHelper = function(room, uri, httpMethod, callback, auth) {
  if (callback === undefined) {
    callback = httpMethod
    httpMethod = 'get'
  }
  exports.httpHelper(room, uri, httpMethod, function(body) {
    return callback(JSON.parse(body))
  }, auth)
}

exports.httpHelper = function(room, uri, httpMethod, callback, auth) {
  if (callback === undefined) {
    callback = httpMethod
    httpMethod = 'get'
  }
  var heads = {'Accept-Language': 'en-us,en;q=0.5', 'Accept-Charset': 'utf-8', 'User-Agent': "Mozilla/5.0 (X11; Linux x86_64; rv:2.0.1) Gecko/20100101 Firefox/4.0.1"}
  
  if (auth) {
    heads['Authorization'] = 'Basic ' + new Buffer(auth.username + ':' + auth.password).toString('base64')
  }
  
  httpMethodMap[httpMethod]({uri: uri, headers: heads}, function(err, res, body) {
    if (err || res.statusCode >= 400 || body === undefined) {
      return room.error(err)
    }
    return callback(body)
  })
}
