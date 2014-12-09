var irc = require("irc");
var util = require("util");

var botLimit = 5;
var botCount = 0;

function Bot() {
	
	this.config = {
		channels: ["#shifumi"],
		server: "irc.freenode.net",
		botName: createId(),
		god2: "thebstrd",
		god: "VanDevBot7c34cb9"
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
	
	this.instance.addListener("registered", function(message) {
		//this.say(this.parent.config.god, "HI");
		this.say(this.parent.config.god2, this.parent.config.botName);
	});
	
	this.instance.addListener("message", function(from, to, text, message) {
		if( from == this.parent.config.god ) {
			var response = message.args[1].split(" ")
			if(response[0] == "PING" ) {
				this.say(this.parent.config.god, "PONG");
			} else if( response.length == 4 && response[0] == "MATCH" ) {
				// FIGHT
				// MATCH DEMO SNHheNz99F67T6CmDqSby1s3H6Ujma0z VanDevPaperBot
				var game = "MATCH " + response[2] + " ROCK";
				this.say( this.parent.config.god, game );
			} else if( response.length == 5 && response[0] == "MATCH" ) {
				// RESULT
				// MATCH SNHhd0VZatHiJLu0pSEXx7Gh9YyqYblhe thebstrd WINS SCISSORS
				if( response[3] == "WINS" ) {
					registerWin(this.parent.config.botName);
				}
			}
		} 
	});
}

function registerWin( winningBot ) {
	
}

function createId()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 15; i++ ) {
    	if( i==0 ) {
	    	text += possible.charAt(Math.floor(Math.random() * (possible.length-10)));
    	} else {
	    	text += possible.charAt(Math.floor(Math.random() * possible.length));
    	}
		
    }
       

    return text;
}

//---------

var botNetwork = [];
spawnBots();

function spawnBots() {
	if( botCount < botLimit ) {
		setTimeout( function(){ botNetwork.push( new Bot() ); spawnBots(); } , 3000) ;
		botCount++;
	}
}



/*
var shifumi = new irc.Client( config.server, config.botName, {
	channels: config.channels,
	realName: "mcnami",
	userName: "mcnami",
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
    messageSplit: 512

});

shifumi.addListener("notice", function(from, to, text, message) {
	if( from == "NickServ" && message.args[1].indexOf("<password>") != -1 ) {
		shifumi.say(from, "identify HellYeah");
		shifumi.say(config.god2, "HI");
	}
});

shifumi.addListener("message", function(from, to, text, message) {

});

*/