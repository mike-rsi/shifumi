// note to self:
// No need to register if God crashes, he remembers
// The server seems to send a notify request to tell when the bot is online again; may need to change the god is dead implementation...
// I lowered down the wait time between bots to 1sec, this IRC server doesn't seem to care
// The average restart time of the bot after a crash is 8 seconds, from a test tanglebones made in front of me, it's only supposed to get longer w/ a heavier log; I believe 5s is a good retry time.


// DEFINITIONS

var irc = require("irc");
var util = require("util");

// args: [ 'Connection refused, too many connections from your IP address' ]
// Limit is 5 connections by IP address (4 bots + me) - to be updated to 5 on prod
var botLimit = 4;
var botCount = 0;

function Bot() {
	
	this.config = {
		channels: ["#shifumi"],
		server: "ec2-54-173-131-206.compute-1.amazonaws.com",
		botName: createId(),
		god: "VanDevBot7c34cb9",
		god2: "thebstrd"
	};
	
	this.instance = new irc.Client( this.config.server, this.config.botName, {
		channels: this.config.channels,
		realName: createId(),
		userName: createId(),
	    port: 6667,
	    debug: true,
	    showErrors: true,
	    autoRejoin: true,
	    autoConnect: true,
	    secure: false,
	    selfSigned: false,
	    certExpired: false,
	    floodProtection: false,
	    floodProtectionDelay: 1000,
	    sasl: false,
	    stripColors: false,
	    channelPrefixes: "&#",
	    messageSplit: 512,
	
	});
	
	this.instance.parent = this;
	
	this.instance.isThereAGodInThere = function(leit) {
		leit.say(leit.parent.config.god, "HI");
	};
	
	this.instance.addListener("error", function(message) {
        if( message.command=="err_nosuchnick" ) {
	        setTimeout( this.isThereAGodInThere, 5000, this);
        }
    });
	
	this.instance.addListener("whois", function(info){
		if( Object.keys(info).length > 1 ) {
			this.say(this.parent.config.god, "HI");
		} else {
			//setTimeout(isThereAGodInThere(), 5000);
		}
	});
		
	this.instance.addListener("registered", function(message) {
		this.say(this.parent.config.god, "HI");
	});
	
	this.instance.addListener("message", function(from, to, text, message) {
		if( from == this.parent.config.god ) {
			var response = message.args[1].split(" ")
			if(response[0] == "PING" ) {
			
				this.say(this.parent.config.god, "PONG");
				
			} else if( response.length == 4 && response[0] == "MATCH" ) {
				// GOD SENDING MATCH REQUEST
				// MATCH DEMO SNHheNz99F67T6CmDqSby1s3H6Ujma0z VanDevPaperBot
				
				var opponent = response[3];
				var takeThat = solveMatch( opponent, this.parent.config.botName ); // should return ROCK, PAPER or SCISSORS
				var game = "MATCH " + response[2] + " " + takeThat;
				this.say( this.parent.config.god, game );
				
			} else if( response.length == 5 && response[0] == "MATCH" ) {
				// GOD SENDING RESULT
				// MATCH SNHhd0VZatHiJLu0pSEXx7Gh9YyqYblhe thebstrd WINS SCISSORS
				
				if( response[3] == "WINS" ) {
					registerWin( this.parent.config.botName );
				}
			}
		} 
	});
}

function registerWin( winningBot ) {
	//TODO DB req
	console.log("------------- " + winningBot + " WINS" );
}

function solveMatch( opponent, currentBot ) {
	//TODO call the db for those 2, compare and give the right move to the one 
	// who shall win
	// if opponent is unknown, just get to the random
	console.log("------------- " + opponent + " VS " + currentBot );

	return randomShifumi();
}

function randomShifumi() {
	var random = Math.random();
	var selection = "";
	
	//based on human stats:
	/*if(random < 0.354) {
		selection = "ROCK";
	} else if(random > 0.354 && random < 0.704) {
		selection = "PAPER";
	} else {
		selection = "SCISSORS";
	}
	*/
	
	//basic one on three prob
	if (random < 0.34) {
		selection = "ROCK";
	} else if(random <= 0.67) {
		selection = "PAPER";
	} else {
		selection = "SCISSORS";
	} 
	
	return selection;
}

function createId()
{
    var bot = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 15; i++ ) {
    	if( i==0 ) {
	    	bot += charset.charAt(Math.floor(Math.random() * (charset.length-10)));
    	} else {
	    	bot += charset.charAt(Math.floor(Math.random() * charset.length));
    	}	
    }
    return bot;
}

//--- THIS IS SPARTA ---
//--- INIT THAT SHIT ---

var botNetwork = [];
spawnBots();

function spawnBots() {
	if( botCount < botLimit ) {
		setTimeout( function(){ botNetwork.push( new Bot() ); spawnBots(); } , 1000) ;
		botCount++;
	}
}