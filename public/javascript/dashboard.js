var updateBot = function (bot) {
  var data = {
    irc: null,
    capfire: null
  }
  if(bot) {
    if(bot.services) {
      bot.services.forEach(function(type) {
        var serviceStats = null
        data[type.type] = {
          calls: {
            total: 0,
            commands:[]
          }
        }
        for(var i in bot.services) if (bot.services[i].type == type.type) serviceStats = bot.services[i]
        var commandStats = serviceStats.commands
        var total = 0;
        Object.keys(commandStats).forEach(function(name) {
          var value = commandStats[name]
          total += value
          data[type.type].calls.commands.push({
            command:name,
            value:value
          })
        })
        data[type.type].calls.total = total
        data[type.type].calls.commands.sort(function(a, b) {return b.value - a.value})
      })
    }
  }
  new EJS({url: '/ejs/stats.ejs', cache:false}).update("bot-stats",data)
}

$(document).ready(function() {
  socket.waitEmit('botStatus', {})
  socket.on('botStatusResponse', updateBot)
})

