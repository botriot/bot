"use strict"

var settings = require('./settings')
  , logger = settings.logger(module)
  , hook = settings.hook
  , services = require('./common/services/index')
  , models = require('./models')
  , _ = require('underscore')

module.exports = function(app, socket) {
  app.use(function(req, res, next) {
    if (settings.production) {
      if (req.headers.host && !(req.headers.host === 'botriot.com')) {
        res.redirect('http://botriot.com/')
        return
      }
    }
    if (req.session && !req.session.auth) {
      delete req.session.user
    }
    next()
  })

  app.get('/', function(req, res){
    if (req.loggedIn) return res.redirect('/dashboard/')

    res.render('home', {
      title: '',
      layout: 'splash_layout'
    })
  })

  app.get('/_stats', loggedIn, adminOnly, function(req, res){
    res.render('_stats', {
      title: '',
      layout: '_stats'
    })
  })

  app.get('/health', function(req, res) {
    res.send('Salad dressing')
  })

  app.get('/_stats.json', function(req, res) {
    var appStats = {}
    models.User.find({}, function(err, users) {
      if (err) {
        logger.error(err)
        return res.send(err)
      }
      appStats['users'] = users.length
      var commands = []
      var allCommands = models.allCommands()
      Object.keys(allCommands).forEach(function(setName) {
        commands = commands.concat(_.pluck(allCommands[setName], 'name'))
      })
      // grab general bot information
      hook.emit('status', {callback: function(err, msg) {
        if (msg) {
          appStats['bots'] = msg
        }

        // TODO: Do not hardcode this
        services.getGlobalCommandStats(['campfire', 'irc'], commands, function(err, stats) {
          var mStats = {}
          var total = 0
          Object.keys(stats).forEach(function(key) {
            var results = []
            mStats[key] = {}
            Object.keys(stats[key]).forEach( function(name) {
              var val = stats[key][name]
              results.push(+val+':'+name)
              mStats[name] = (mStats[name] || 0) + parseInt(val)
              mStats[key][name] = parseInt(val)
              total += parseInt(val)
            })
          })

          appStats['total_commands_serviced'] = total
          appStats['commands'] = mStats

          res.send(JSON.stringify(appStats))
        })
      }})
    })
  })

  app.get('/stats.json', function(req, res) {
    // TODO get individual stats
    var appStats = {}
    res.send(JSON.stringify(appStats))
  })

  app.get('/bot/create', loggedIn, hasBot(false), function(req, res) {
    res.render('create_bot', {
      title: 'Create a bot',
      user: req.user,
      layout: 'single_page'
    })
  })

  app.get('/tos', function(req, res) {
    res.render('tos', {
      title: 'Terms of Service',
      layout: 'single_page'
    })
  })

  app.get('/contact/', function(req, res) {
    res.render('contact', {
      title: 'Contact Us',
      layout: 'single_page'
    })
  })

  app.post('/bot/create', loggedIn, hasBot(false), function(req, res, next) {
    var bot = new models.Bot()
    var name = req.body.botnameinput
    if (!name.match(/^[A-za-z0-9]+$/)) {
      res.redirect('/bot/create')
      return false
    }
    logger.debug('creating bot with name ' + name)
    bot.name = name
    req.user.bots = [bot]
    req.user.save(function(err) {
      if (err) return next(err)
      models.Bot.spawn(req.user, bot)
      res.redirect('/dashboard/')    
    })
  })

  app.get('/dashboard/', loggedIn, hasBot(true), function(req, res){
    res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      bot: models.User.bot(req.user),
      dashboardclass: 'selected'
    })
  })

  app.get('/commands/', loggedIn, hasBot(true), function(req, res){
    var commandSets = models.allCommands()

    var bot = models.User.bot(req.user)

    _.each(commandSets, function(set) {
      _.each(set, function(command) {
        if (command.help) {
          command.help = command.help.replace(/BOT/g, bot.name)
        }
      })
    })
    res.render('commands', {
      title: 'Commands',
      user: req.user,
      bot: models.User.bot(req.user),
      commandsclass: 'selected',
      types: commandSets
    })
  })

  app.get('/services/', loggedIn, hasBot(true), function(req, res){
    res.render('services', {
      title: 'Services',
      user: req.user,
      bot: models.User.bot(req.user),
      servicesclass: 'selected'
    })
  })

  app.get('/settings/', loggedIn, hasBot(true), function(req, res){
    res.render('settings', {
      title: 'Settings',
      user: req.user,
      bot: models.User.bot(req.user),
      settingsclass: 'selected'
    })
  })

  // Middleware

  function loggedIn(req, res, next) {
    if (!req.loggedIn) return res.redirect('/')
    req.session.user = req.user
    next()
  }

  function hasBot(mustHaveBot) {
    return function(req, res, next) {
      var user = req.user
      if (user.bots.length === 0 && mustHaveBot) return res.redirect('/bot/create/')
      if (user.bots.length > 0 && !mustHaveBot) return res.redirect('/dashboard/')
      next()
    }
  }

  function adminOnly(req, res, next) {
    if (!req.user.is_admin()) return res.redirect('/')
    next()
  }
}
