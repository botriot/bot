"use strict"

exports.disable = {
  admin: true,
  description: 'Disables the specified command.  Enable it with !enable <command_name>.',
  func: function(room, args, options) {
    var command = args
    if (command === undefined) return room.speak('Please supply a command name.')
    room.bot.disableCommand(command, function(err, response) {
      if (err) return room.error(err)
      room.speak(command + ' disabled. Enable with !enable ' + command)
    })
  }
}

exports.enable = {
  admin: true,
  description: 'Enables the specified command.  Disable with !disable <command_name>.',
  func: function(room, args, options) {
    var command = args
    if (command === undefined) return room.speak('Please supply a command name.')
    room.bot.enableCommand(command, function(err, response) {
      if (err) return room.error(err)
      room.speak(command + ' enabled. Disable with !disable ' + command)
    })
  }
}
