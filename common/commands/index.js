"use strict"

var path = require('path')
  , fs = require('fs')
  , _ = require('underscore')
  , commander = require('commander')

var createFakeRoom = function () {
  return {
    users: function (callback) {
      callback([
               {name:'wolverine'},
               {name:'gambit'},
               {name: 'cyclops'}
      ])
    },

    paste: function (msg) {
      console.log(msg)
    },

    speak: function (msg) {
      console.log(msg)
    },
  }
}

var test = function (mName, command, msg) {
  if (mName === undefined) {
    console.log('please specify a module')
    return
  }

  if (command === undefined) {
    console.log('please specify a command')
    return
  }

  var m = require('./'+mName)
  if (m[command] === undefined) {
    console.log('command '+command+' does not exist in '+mName)
    return
  }

  m[command](createFakeRoom(), msg)
}

var addOption = function(parser, option) {
  parser.option.apply(parser, option)
}

var parserForCommand = function(command, extraArgs, stream) {
  var program = null

  // Only command objects that specify the 'commands'
  // or 'options' or 'description' key can have a parser
  if(command.commands || command.options || command.description) {
    program = command.program

    if(!program) {
      program = new commander.Command()

      // Override these values so they don't go to 
      // console.log
      program.error = stream || console.error
      program.log = stream || console.log

      // THIS IS IMPORTANT TO OVERRIDE
      program.exit = function () {}

      program.option('-h --help', 'output usage information')
      program.on('help', function() {
        var helpString = program.helpInformation()
        if(command.description) {
          helpString = command.description + '\n' + helpString
        }
        program.log(helpString)
      })

      var args = command.commands
      if(args) {
        Object.keys(args).forEach(function(command) {

          // Generate the parser for this command
          var parser = program.command(command)
          var config = args[command]

          if (_.isFunction(config)) {
            // Shortcut for simple actions
            config = {func: config}
          }

          // Apply any options that may be present
          if(config.options) {
            config.options.forEach(function(option) {
              addOption(parser, option)
            })
          }

          // Apply a description
          if(config.description) {
            parser.description(config.description)
          }

          // Add the callback function that should be executed
          // when this command has been discovered
          if(config.func) {

            // Make sure that we are passing in the proper
            // parameters here
            parser.action(function () {
              var roomObj = program.extraArgs || extraArgs
              if (config.admin || command.admin) {
                if (!roomObj.from.admin) {
                  return roomObj.speak("Admin privilege is required for this command.");
                }
              }
              config.func(roomObj, program.args.join(' '), program)
            })
          }
        })
      } else {
        var options = command.options || []
        options.forEach(function(option) {
          addOption(program, option)
        })

        program.description = command.description
      }

      program.extraArgs = extraArgs
    }
  }

  return program
}

module.exports = {
  all: _.memoize(function() {
    var commands = {}

    // Assigns a parser to the command object
    function applyParser(command) { 
      command['parser'] = function(extraArgs, stream) {
        return parserForCommand(command, extraArgs, stream)
      }
    }

    fs.readdirSync(__dirname).forEach(function(file) {
      if (file.match(/\.js$/) && file !== 'index.js' && file[0] !== '_') {
        var modCommands = commands[file] = require(path.join(__dirname, file))
        if (typeof modCommands === 'object') {
          _.each(modCommands, function(command, name) {
            command.name = name
            applyParser(command)
          })
        } else {
          applyParser(modCommands)
        }
      }
    })

    return commands
  }),

  test: test,
}

if (module == process.mainModule) {
  var args = process.argv
  test(args[2], args[3], args[4])
}
