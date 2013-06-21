$(document).ready(function(){

  var regex = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i

  var linkify = function(text){
    if (text) {
      text = text.replace(regex,
            function(url){
              var full_url = url
              if (!full_url.match('^https?:\/\/')) {
                full_url = 'http://' + full_url
              }
              return '<a href="' + full_url + '">' + url + '</a>'
            }
        )
    }
    return text
  }
    

  var socketReady = false

  $(".screen").click(function(){
    $(".screen, .modal").hide()
  })
  $(".chatnow").live('click', function(){
    // lazy socket for splash page
    if (!socket) {
      socket = io.connectWithSession()
      prepareSocketIO()
      socket.on('connect-session', function() {
        socketReady = true
      })
    }

    $(".screen, .modal").show();
    var command = $(this).attr("command");
    $('#chatroominput').val(command);
    $('#chatform').submit();
    return false;
  })
  // esc key close event
  $(document).keyup((function(obj){return function(e){
      if(e.keyCode==27) {
          $(".screen, .modal").hide();
      }
  }})(this));

  $('#chatform').unbind('submit').submit(function(event) {
    var input = $('#chatroominput').val()
    if (input.replace(/\s/g,"")=="") return false;

    var li = $('<li class="me"><span class="user">You</span></li>')
    var span = $('<span class="message"></span>')
    li.append(span)

    span.text(input)

    $('#chatform .chat').append(li)
    $("#chatform .chat").prop({ scrollTop: $("#chatform .chat").prop("scrollHeight") });

    // Because we might be lazy connecting to socket.io
    if (!socketReady) {
      socket.on('connect-session', function() {
        socket.emit('browserChatMessage', {message: input})
      })
    } else {
      socket.emit('browserChatMessage', {message: input})
    }

    $('#chatroominput').val('')

    return false
  })

  function prepareSocketIO() {
    socket.on('browserChatResponse', function(message) { var name = 'Botriot'
      if (message.bot) {
        name = message.bot.name
        message = message.message
      }

      var li = $('<li>')
      li.append($('<span class="user"></span>').text(name))
      var span = $('<span class="message"></span>')
      li.append(span)

      if (message.speak) {
        linked = linkify(message.speak)
        span.html(linked)
      } else if (message.paste) {
        span.append($('<pre class="chat-pre">').text(message.paste))
      } else if (message.image) {
        span.append($('<img class="chat-img">').attr('src', message.image).load(function() {
          $("#chatform .chat").prop({ scrollTop: $("#chatform .chat").prop("scrollHeight") })
        }))
      }

      $('#chatform .chat').append(li)
      $("#chatform .chat").prop({ scrollTop: $("#chatform .chat").prop("scrollHeight") })
    })
  }

  // We lazyload on the splash page
  if (socket) {
    socketReady = true
    prepareSocketIO()
  }
})
