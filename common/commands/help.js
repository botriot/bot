"use strict"

exports.help = {
  description: "You're looking at it",
  func: function(room, msg, options) {
    var commands = room.commands

    var command = commands[msg]
    var output = ''
    if (command) {
      console.log(command)
      if(!command.program) {
        output = command.name + "\n\n"
               + (command.help || command.description || 'Undocumented').replace(/BOT/g, room.bot.config.name)
               + (command.usage ? "\nUsage: " + commands.usage : '')
      } else {
        output = command.program.helpInformation()
      }
    } else {
      var keys = Object.keys(commands)
      keys.sort()

      output = "There are three ways to run commands:\n"
             + " 1. !<command> ...\n"
             + " 2. " + room.bot.config.name + " <command> me ...\n"
             + " 3. " + room.bot.config.name + " <command> ...\n\n"

      output += "Commands: " + keys.filter(function(k) {return !commands[k].hidden }).join(", ") + "\n\nfor help on a specific command use ![command] --help"
    }

    room.paste(output)
  }
}
