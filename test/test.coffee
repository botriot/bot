speak = (msg) -> {msg: msg, type: 'speak'}
paste = (msg) -> {msg: msg, type: 'paste'}
image = (msg) -> {msg: msg, type: 'image'}

any = (msg) -> {msg: msg, type: 'any'}
wrap = (msg) -> if msg.type then msg else any(msg)

module.exports = {speak, paste, image, any, wrap}

if module == require.main
  failures = 0
  successes = 0

  finish = (command, input, output, error) -> 
    full = command.name + (if input then ' ' + input else '')
    if error
      console.log " -FAIL- !#{full} => #{output.msg} (#{error})"
      failures++
    else
      console.log "  PASS  !#{full} => #{output.msg}"
      successes++

  validate = (output, expected) ->
    if expected.msg instanceof RegExp
      if not expected.msg.test(output.msg)
        return "Expected to match: #{expected.msg}"
    else if typeof expected.msg == 'function'
      if not expected.msg(output)
        return "Expected to match: #{expected.msg.toString()}"
    else
      if expected.msg != output.msg
        return "Expected: #{expected.msg}"
    if expected.type != 'any'
      if expected.type != output.type
        return "Expected output type: #{expected.type}"

  checkCommand = (command, input, expected) ->
    # TODO mock more of the room
    room =
      from:
        name: 'test'
        admin: false
      speak: (msg) -> finish(command, input, speak(msg), validate(speak(msg), expected))
      paste: (msg) -> finish(command, input, paste(msg), validate(paste(msg), expected))
      image: (msg) -> finish(command, input, image(msg), validate(image(msg), expected))
      error: (err) -> finish(command, input, speak(''), err.stack or err)

    parser = command.parser(room, room.paste)

    parser.parse(['node', command].concat(input.split(/\s+/)))

    if not command.commands
      try
        command.func(room, parser.args.join(' '), parser)
      catch err
        finish(command, input, speak(''), err.stack or err)

  settings = require '../settings'
  settings.redis =
    host: ''
    port: ''

  commandsModule = require '../common/commands'
  all = commandsModule.all()
  flattened = {}
  for file, commands of all
    for k, v of commands
      flattened[k] = v

  for name, tests of require('./commands').tests()
    command = flattened[name]
    msg = tests.msg or tests
    if msg instanceof RegExp
      checkCommand(command, "", wrap(tests))
    else if typeof msg == 'string'
      checkCommand(command, "", wrap(tests))
    else if typeof msg == 'function'
      checkCommand(command, "", wrap(tests))
    else if tests.msg
      checkCommand(command, "", wrap(tests))
    else if tests.join
      for expected in tests
        checkCommand(command, '', wrap(expected))
    else
      for input, expected of tests
        checkCommand(command, input, wrap(expected))

  exceptionThrown = null
  process.once 'uncaughtException', (err) ->
    exceptionThrown = err
    process.nextTick -> throw err

  process.once 'exit', ->
    if failures > 0
      process.stderr.write("\nFAILURES: #{failures}/#{failures + successes}\n")
      process.exit(1)
    else
      console.log("\nOK: #{successes}/#{successes}")
