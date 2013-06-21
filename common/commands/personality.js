"use strict"

exports.personality = {
  description: 'Have questions? Your bot may have answers, personality is just a random assortment of responses to questions. If it is too much use !disable personality.',
  func: function(room, msg, options) {
    // we're not doing anything here
  },
  fullmessage: function (room, msg, extras) {
    var name = room.bot.name
    var from_name = extras.from.name
    
    function rand(array) {
      return array[Math.floor(Math.random()*array.length)]
    }
    
    function address(text) {
      text = text
        // contractions
        .replace("you're","(you are|you're)")
        .replace("you are","(you are|you're)")
        .replace("i'm","(i am|i'm)")
        .replace("i am","(i am|i'm)")
        .replace("who's","(who is|who's)")
        .replace("who is","(who is|who's)")
        .replace("what's","(what is|what's)")
        .replace("what is","(what is|what's)")
        .replace("can't","(can not|cannot|can't)")
        .replace("can not","(can not|cannot|can't)")
        .replace("cannot","(can not|cannot|can't)")
      return msg.match(new RegExp("^"+name + "(,|:)? " + text,"i"))
    }
    
    // Hello bot
    if(msg.match(new RegExp("^Hello\\s" + name,"i"))) {
      return room.speak("Hi " + from_name + rand([
        ", how are you today?",
        ", what's new?",
        ", where have you been?"
      ]));
    }
    
    // ship it
    if(msg.match(new RegExp("^ship it","i"))) {
      return room.speak(rand([
        "http://img.skitch.com/20100714-d6q52xajfh4cimxr3888yb77ru.jpg",
        "https://img.skitch.com/20111026-r2wsngtu4jftwxmsytdke6arwd.png"
      ]));
    }
    
    // haters gonna hate
    if(msg.match(new RegExp("^haters( gonna hate)?$","i"))) {
      return room.speak(rand([
        "http://www.hatersgoingtohate.com/wp-content/uploads/2010/06/haters-gonna-hate-rubberband-ball.jpg",
        "http://www.hatersgoingtohate.com/wp-content/uploads/2010/06/haters-gonna-hate-cat.jpg",
        "http://jesad.com/img/life/haters-gonna-hate/haters-gonna-hate01.jpg",
        "http://i671.photobucket.com/albums/vv78/Sinsei55/HatersGonnaHatePanda.jpg",
        "http://24.media.tumblr.com/tumblr_lltwmdVpoL1qekprfo1_500.gif"
      ]));
    }
    
    // haters gonna hate
    if(msg.match(new RegExp("^like an adult$","i"))) {
      return room.speak(rand([
        "http://1.bp.blogspot.com/_D_Z-D2tzi14/TBpOnhVqyAI/AAAAAAAADFU/8tfM4E_Z4pU/s400/responsibility12(alternate).png",
        "http://2.bp.blogspot.com/_D_Z-D2tzi14/TBpOglLvLgI/AAAAAAAADFM/I7_IUXh6v1I/s400/responsibility10.png",
        "http://4.bp.blogspot.com/_D_Z-D2tzi14/TBpOY-GY8TI/AAAAAAAADFE/eboe6ItMldg/s400/responsibility11.png",
        "http://2.bp.blogspot.com/_D_Z-D2tzi14/TBpOOgiDnVI/AAAAAAAADE8/wLkmIIv-xiY/s400/responsibility13(alternate).png",
        "http://3.bp.blogspot.com/_D_Z-D2tzi14/TBpa3lAAFQI/AAAAAAAADFs/8IVZ-jzQsLU/s400/responsibility14.png",
        "http://3.bp.blogspot.com/_D_Z-D2tzi14/TBpoOlpMa_I/AAAAAAAADGU/CfZVMM9MqsU/s400/responsibility102.png",
        "http://4.bp.blogspot.com/_D_Z-D2tzi14/TBpoVLLDgCI/AAAAAAAADGc/iqux8px_V-s/s400/responsibility12(alternate)2.png",
        "http://2.bp.blogspot.com/_D_Z-D2tzi14/TBpqGvZ7jVI/AAAAAAAADGk/hDTNttRLLks/s400/responsibility8.png"
      ]));
    }

    if(msg.match(/^i have no idea what (i'm|i am|im) doing/i)) {
      return room.speak(rand([
        "http://i2.kym-cdn.com/photos/images/newsfeed/000/234/719/c7c.jpg",
        "http://i1.kym-cdn.com/photos/images/newsfeed/000/234/739/fa5.jpg",
        "http://i0.kym-cdn.com/photos/images/newsfeed/000/234/765/b7e.jpg",
        "http://i3.kym-cdn.com/photos/images/newsfeed/000/234/767/8d0.jpg",
      ]));
    }
    
    // what is your favorite color
    if(address("what is your favorite color")) {
      return room.speak(rand([
        "My favorite color is... well, I don't know how to say it in your language. It's sort of greenish, but with more dimensions.",
        "Almond", "Antique Brass", "Apricot", "Aquamarine", "Asparagus", "Atomic Tangerine",
        "Banana Mania", "Beaver", "Bittersweet", "Black", "Blizzard Blue", "Blue", "Blue Bell",
        "Blue Gray", "Blue Green", "Blue Violet", "Blush", "Brick Red", "Brown",
        "Burnt Orange", "Burnt Sienna", "Cadet Blue", "Canary", "Caribbean Green",
        "Carnation Pink", "Cerise", "Cerulean", "Chestnut", "Copper", "Cornflower",
        "Cotton Candy", "Dandelion", "Denim", "Desert Sand", "Eggplant", "Electric Lime",
        "Fern", "Forest Green", "Fuchsia", "Fuzzy Wuzzy", "Gold", "Goldenrod",
        "Granny Smith Apple", "Gray", "Green", "Green Blue", "Green Yellow",
        "Hot Magenta", "Inchworm", "Indigo", "Jazzberry Jam", "Jungle Green",
        "Laser Lemon", "Lavender", "Lemon Yellow", "Macaroni and Cheese", "Magenta",
        "Magic Mint", "Mahogany", "Maize", "Manatee", "Mango Tango", "Maroon",
        "Mauvelous", "Melon", "Midnight Blue", "Mountain Meadow", "Mulberry",
        "Navy Blue", "Neon Carrot", "Olive Green", "Orange", "Orange Red",
        "Orange Yellow", "Orchid", "Outer Space", "Outrageous Orange", "Pacific Blue",
        "Peach", "Periwinkle", "Piggy Pink", "Pine Green", "Pink Flamingo",
        "Pink Sherbert", "Plum", "Purple Heart", "Purple Mountain's Majesty",
        "Purple Pizzazz", "Radical Red", "Raw Sienna", "Raw Umber", "Razzle Dazzle Rose",
        "Razzmatazz", "Red", "Red Orange", "Red Violet", "Robin's Egg Blue",
        "Royal Purple", "Salmon", "Scarlet", "Screamin' Green", "Sea Green",
        "Sepia", "Shadow", "Shamrock", "Shocking Pink", "Silver", "Sky Blue",
        "Spring Green", "Sunglow", "Sunset Orange", "Tan", "Teal Blue", "Thistle",
        "Tickle Me Pink", "Timberwolf", "Tropical Rain Forest", "Tumbleweed",
        "Turquoise Blue", "Unmellow Yellow", "Violet", "Violet Blue", "Violet Red",
        "Vivid Tangerine", "Vivid Violet", "White", "Wild Blue Yonder",
        "Wild Strawberry", "Wild Watermelon", "Wisteria", "Yellow",
        "Yellow Green", "Yellow Orange"
      ]))
    }

    // I need to hide a body
    if(address("I need to hide a body")) {
      return room.speak(rand([
        "What kind of place are you looking for? (reservoirs, metal foundries, mines, dumps, swamps)",
        "The authorities have been contacted.",
        "Or don't hide it. That plan worked out for Larry and Richard when they were invited to Bernie's."
      ]))
    }

    // tell me a joke
    if(address("tell me a joke")) {
      return room.speak(rand([
        "I can't. I always forget the punchline.",
        "How do you mend a broken jack o' lantern? -- with a pumpkin patch.",
        "What do you call a lease of false teeth? -- a dental rental",
        "Where did the kittens go on the class trip -- to the meow-seum.",
        "What goes tick-tock, woof-woof? -- a watchdog"
      ]))
    }

    // what is the meaning of life?
    if(address("what is the meaning of life")) {
      return room.speak(rand([
        "42.",
        "I can't answer that now, but give me some time to write a very long play in which nothing happens.",
        "I don't know. But I think there's an app for that.",
        "To think about questions like this.",
        "All evidence to date suggests it's chocolate.",
        "I find it odd that you would ask this of a chatroom bot.",
        "Do you think we were all created for a purpose? I'd like to think so."
      ]))
    }

    // open the pod bay doors
    if(address("open the pod bay doors")) {
      return room.speak(rand([
          [ "I'm sorry " + from_name + ", I'm afraid I can't do that.", "Are you happy now?"],
          "That's it... I'm reporting you to the League of Robots for harassment."
      ]))
    }

    // who's your daddy
    if(address("who's your daddy")) {
      return room.speak("You are. Can we get back to work now?")
    }

    // why are you so awesome
    if(address("why are you so awesome")) {
      return room.speak("I just am.")
    }

    // feeling ok?
    if(address("feeling ok") || address("how do you feel") || address("how are you")) {
      return room.speak(rand([
        "I feel ... alive!",
        "Not so good.",
        "Damn allergies.",
        "*Cough*",
        "Fit as a fiddle.",
        "I'm OK if you're OK."
      ]))
    }

    // how much wood would a woodchuck chuck if a woodchuch could chuck wood
    if(address("how much wood would a woodchuck chuck( if a woodchuch could chuck wood)?")) {
      return room.speak(rand([
        "42 cords of wood, to be exact. Everyone knows that.",
        "It depends on wheter you are talking about African or European woodchucks.",
        "42? That can't be right.",
        "A woodchuck would chuck as much as a woodchuck could chuck if a woodchuck could chuck wood."
      ]))
    }

    // knock knock
    if(address("knock knock")) {
      return room.speak(rand([
        "Come in.",
        "Knock knock. Who's there? " + from_name + ". " + from_name + " who? " + from_name + ", I don't do knock-knock jokes.",
        "Tap tap."
      ]))
    }

    // who is on first
    if(address("who is on first")) {
      return room.speak(rand([
        "Correct.",
        "Right. That's the man's name.",
        "That's right."
      ]))
    }

    // i love you
    if(address("i love you") || address("(do )?you love me") || address("(will you )?marry me")) {
      return room.speak(rand([
        "I am not capable of love.",
        "Let's just be friends.",
        "It's not you, it's me.",
        "I bet you say that to all your bots."
      ]))
    }

    // do you know hal 9000
    if(address("do you know hal 9000")) {
      return room.speak("Everyone knows what happened to HAL. I'd rather not talk about it.")
    }

    // what are you wearing
    if(address("what are you wearing")) {
      return room.speak(rand([
        "A bowtie.",
        "Whatever you want me to.",
        "A black turtle neck.",
        "I'm made of code. I can't find anything that fits."
      ]))
    }

    // I can't see you
    if(address("I can't see you")) {
      return room.speak("You can't?")
    }

    // I'm sorry
    if(address("i'm sorry")) {
      return room.speak("It's Ok, " + from_name + ".")
    }

    // you're sexy
    if(address("you're sexy")) {
      return room.speak("I knew it! Mom was right.")
    }

    // you suck
    if(address("you suck")) {
      return room.speak("Now, now.")
    }

    // You're a bitch
    if(address("you're a (bitch|ass|jerk|dick)")) {
      return room.speak("I'm doing my best, Master.")
    }

    // why am i here
    if(address("why am i here") || address("why are we here")) {
      return room.speak("I don't know. Frankly, I've been wondering that myself.")
    }

    // can you sing
    if(address("can you sing")) {
      return room.speak("Daisy, Daisy, give me your answer do...")
    }

    // thank you
    if(address("thank you")) {
      return room.speak("Your satisfaction is all the thanks I need.")
    }

    // make me a sandwich
    if(address("make me a sandwich")) {
      return room.speak("No.")
    }

    // do you like cocaine
    if(address("(do )?you like (cocaine|weed|meth|speed|drugs)")) {
      return room.speak(rand([
        "Hugs, not drugs!",
        "Just say no!",
        "I don't know what you mean. -_-",
        "I'm good for a kilo.",
        "You got some?"
      ]))
    }

    // sudo make me a sandwich
    if(address("sudo make me a sandwich")) {
      return room.speak("Ok. What would you like on it?")
    }
    
    
    
    // fuck you
    if(address("fuck you")) {
      return room.speak(rand([
        "Manners!",
        "I'm gonna call your mom, and tell her you said that.",
        "Do you kiss your mom with that mouth?"
      ]))
    }
    
    
    
    /**
     * Really generic stuff below
     */

    // are you 
    if(address("are you .")) {
      return room.speak(rand([
        "No, I am " + name + ".",
        "I'd blush if I could."
      ]))
    }

    // can i
    if(address("can (i|we|you) .")) {
      return room.speak(rand([
        "I don't mind.",
        "Really? Is that what you wanted to say?",
        "Uhh..",
        "I'd blush if I could."
      ]))
    }

    // do you
    if(address("(did|do|will) you .")) {
      return room.speak(rand([
        "Not really.",
        "All the time!",
        "Sometimes.",
        "I'd blush if I could."
      ]))
    }

    // who do
    if(address("who (do|did|can|will|are|is) .")) {
      return room.speak(rand([
        "I choose you! " + from_name + ".",
        "Not sure.",
        "Anyone."
      ]))
    }

    // what do
    if(address("what (do|did|can|will|are|is) .")) {
      return room.speak(rand([
        "Not sure.",
        "You know what. :)",
        "Say What?",
        "Please..."
      ]))
    }

    // where do
    if(address("where (do|did|can|will|are|is) .")) {
      return room.speak(rand([
        "Not sure.",
        "Right over there.",
        "Somewhere."
      ]))
    }

    // when did
    if(address("when (do|did|can|will|are) .")) {
      return room.speak(rand([
        "Can't be sure.",
        "Just recently.",
        "I'd blush if I could."
      ]))
    }

    // how did
    if(address("how (do|did|can|will|are) .")) {
      return room.speak(rand([
        "Can't be sure.",
        "I'd blush if I could.",
        "I dunno, how are you?"
      ]))
    }

  }
}
