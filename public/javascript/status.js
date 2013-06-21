var setStatus = function (user, bot) {
  var text = '<article><p class="status-row" style="float:right;"><span class="statusicon connected"></span>'+bot.name+' is currently <b class="statustext"></b>.</p><h4 style="font-size:19px;margin-bottom:20px;">'+bot.name+'\'s most used commands</h4><dl class="stats"></dl></article>'
  $("article").replaceWith(text)

  function updateStatus(message) {

    $('.statusicon').removeClass('connected').removeClass('disconnected').removeClass('offline')
    if (message.aliveDuration === 0) {
      // This bitch is offline
      $('.statusicon').addClass('offline')
      $('.statustext').text('offline')
    } else if (message.connectionDuration === 0) {
      // This bitch is disconnected, but alive
      $('.statusicon').addClass('disconnected')
      $('.statustext').text('disconnected')
    } else {
      // We're online
      $('.statusicon').addClass('connected')
      $('.statustext').text('connected')
    }

    // TODO: Figure out wtf to do with multiple services
/*
    if(message.campfire) {
      for(var k in message.campfire.messages.all) {
        $("dl.stats").append("<dt>"+k+"</dt><dd>"+message.campfire.messages.all[k]+"</dd>")
      }
    }
*/
  }

  updateStatus(bot)
}
