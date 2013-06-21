var data = {}

function clearRooms() {
  $("article").empty()
}

function renderServices(services) {
  var serviceMap = {
    'campfire': authCampfire,
    'irc': authIRC
  }

  var servicesstr = "";
  Object.keys(serviceMap).forEach(function(service) {
    window[service] = {}
    servicesstr += new EJS({url: '/ejs/'+service+'_settings.ejs'}).render({"service":{}})
  })

  $("article").append(servicesstr)
  Object.keys(serviceMap).forEach(function(service) {
    $('#'+service+'-form').submit(function() {
      try {
        serviceMap[service]()
      } catch (err) {
        if (window.console) console.error(err)
      }

      return false
    })
  })
}

function authCampfire () {
  var rooms;
  if ($('.campfire-room').length > 0) {
    rooms = []
    $('.campfire-room').each(function(i, e) {
      if ($(e).attr('checked')) {
        rooms.push(window.campfire.availableRooms[i])
      }
    })
  }
  socket.waitEmit('authService', {
    type: 'campfire',
    auth: {
      account: $('#campfire-account').val(),
      token: $('#campfire-token').val(),
      rooms: rooms
    }
  })
}

function authIRC () {
  socket.waitEmit('authService', {
    type: 'irc',
    auth: {},
    rooms: [
      {
        server: $('#irc-server').val(),
        port: $('#irc-port').val(),
        room: $('#irc-room').val(),
        nick: $('#irc-nick').val(),
        password: $('#irc-password').val(),
        secure: $('#irc-ssl').is(":checked")
      }
    ]
  })
}


socket.on('authServiceResponse', function(results) {
  if (results.error) {
    // TODO
    alert(results.error)
  } else {
    clearRooms()
    renderServices(results)
  }
})

$(document).ready(function() {

  socket.waitEmit('getUser', {})

  var handleUpdate = function (msg) {
    data.bot = msg.bot
    clearRooms()
    renderServices(msg.bot.services)
  }

  socket.on('getUserResponse', handleUpdate)
})

