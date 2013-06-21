$(document).ready(function() {
  $('#botnameform').submit(function(event) {
    var input = $('#botnameinput').val()
    socket.waitEmit('setBotName', {message: input})
    return false
  })
})
