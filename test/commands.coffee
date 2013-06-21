exports.tests = ->

  ## BASE

  admin:
    noterror

  define:
    'bot': /^\d+./

  relate:
    'bot': noterror

  curl:
    'http://jsonip.com/': paste /\{"ip":"[0-9.]+"\}/

  stock:
    'AAPL': /^Apple/

  commitmessage:
    noterror

  pivot:
    /^How about/

  weather:
    '94103': /^It's currently/
    '-f 94103': /^Today:.*,Tonight:.*,Tomorrow:/

  flip:
    /(Heads!)|(Tails!)/

  roll:
    '':    /^Rolled a 6-sided die: \d+/
    '100': /^Rolled a 100-sided die: \d+/
    'x':   "That's not a valid number"

  eightball:
    noterror

  curse:
    '': /^Thou/
    'Botriot': /^Botriot, thou/

  echo:
    'hi': 'hi'

  ## FOOD

  eat:
    '94103': /^http.*,.* @ /

  ## IMAGES

  image:
    'bot': image url
    '-u bot': image url
    '-m bot': image /^http:\/\/mustachify\.me/

  mustachify:
    'bot': image /^http:\/\/mustachify\.me/

  mustache:
    'bot': image /^http:\/\/mustachify\.me/

  posterous:
    'iansfw': image url

  tumblr:
    'thisiswhyyourefat.tumblr.com': image url

  eyebleach:
    '': image url
    '-g': image url
    '-b': image url

  rage:
    image noterror

  #ragelist:
  #  paste noterror

  ## MOVIES

  movie:
    'inception': noterror

  youtube:
    'nyan cat': url

  ## MUSIC

  lyric:
    'beer': noterror

  play:
    'beer': url

  kanye:
    noterror

  twitter:
    'bieber': url
    '-t @botriot/team': paste noterror

  wiki:
    'bot': url

  answer:
    'how is babby formed?': /^Q:/
  
  math:
    '2 + 2': '4'

  translate:
    'bueno': 'good'

  google:
    'yahoo': url
  
#
#
#

noterror = (output) -> output.msg.indexOf('Error') != 0
url = /^http/

{speak, paste, image, any, wrap} = require('./test')
