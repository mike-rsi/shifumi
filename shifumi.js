// note to self:
// No need to register if God crashes, he remembers
// The server seems to send a notify request to tell when the bot is online again; may need to change the god is dead implementation...
// I lowered down the wait time between bots to 1sec, this IRC server doesn't seem to care
// The average restart time of the bot after a crash is 8 seconds, from a test tanglebones made in front of me, it's only supposed to get longer w/ a heavier log; I believe 5s is a good retry time.


// DEFINITIONS

var irc = require("irc");
var async = require("async");
var AWS = require("aws-sdk");

// TODO: Add your credentials (but don't check them in to GitHub!)
AWS.config.update({
	accessKeyId: '',
	secretAccessKey: '',
	region: 'us-west-2'
});
var ddb = new AWS.DynamoDB();

// args: [ 'Connection refused, too many connections from your IP address' ]
// Limit is 5 connections by IP address (4 bots + me) - to be updated to 5 on prod
var botLimit = 2;
var botCount = 0;

function Bot() {
	
	this.config = {
		channels: ["#shifumi"],
		server: "ec2-54-173-131-206.compute-1.amazonaws.com",
		botName: createId(true),
		god: "VanDevBot7c34cb9",
	};
	
	this.instance = new irc.Client( this.config.server, this.config.botName, {
		channels: this.config.channels,
		realName: createId(false),
		userName: createId(false),
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
				var ourBot = this.parent.config.botName;
				// TODO: ourMove is out of scope of async.parallel callback.
				var ourMove = "";

				async.parallel(
					{
						ourScore: function(callback) {
							ddb.getItem(getParams(ourBot), function(err, data) {
								var score = 0;
								if (err) {
									console.log(err);
								} else if ('Item' in data) {
									gamesPlayed = parseInt(data.Item.gamesPlayed.N);
									wins = parseInt(data.Item.wins.N);
									if (gamesPlayed > 0) score = wins / gamesPlayed;
									console.log("US: " + ourBot + ", SCORE: " + score);
								} else {
									console.log("This shouldn't happen");
								}
								callback(null, score);
							});
						},
						oppScore: function(callback) {
							ddb.getItem(getParams(opponent), function(err, data) {
								var score = 0;
								if (err) {
									console.log(err);
								} else if ('Item' in data) {
									gamesPlayed = parseInt(data.Item.gamesPlayed.N);
									wins = parseInt(data.Item.wins.N);
									if (gamesPlayed > 0) score = wins / gamesPlayed;
									console.log("OPPONENT: " + opponent + ", SCORE: " + score);
								} else {
									// Not one of our bots.
									score = -1;
								}
								callback(null, score);
							});
						}
					},
					function(err, data) {
						console.log(data);
						if (data.ourScore < 0 || data.oppScore < 0 || data.ourScore == data.oppScore) {
							// TODO: Random seems to be always chosen.
							// Let fate take its course.
							ourMove = randomShifumi();
							console.log("MAY THE BEST BOT WIN: " + ourMove);
						} else if (data.ourScore > data.oppScore) {
							// We're higher ranked, so we'll win with ROCK.
							ourMove = "ROCK";
							console.log("WINNING WITH " + ourMove);
						} else if (data.ourScore > data.oppScore) {
							// They're higher ranked, so we'll lose with SCISSORS.
							ourMove = "SCISSORS";
							console.log("THROWING THE MATCH WITH " + ourMove);
						}
					}
				);

				var game = "MATCH " + response[2] + " " + ourMove;
				this.say( this.parent.config.god, game );
				
			} else if( ( response.length == 5 || response.length == 3 )&& response[0] == "MATCH" ) {
				// GOD SENDING RESULT
				// MATCH <match ID> <winning bot's name> WINS <ROCK | PAPER | SCISSORS>
				// MATCH <match ID> TIE
				
				if( response[2] == this.parent.config.botName && response[3] == "WINS" ) {
					// WIN, increment gamesPlayed and wins.
					updateBot( this.parent.config.botName, 1, 1 );
				} else {
					// LOSS or TIE, increment gamesPlayed only.
					updateBot( this.parent.config.botName, 1, 0 );
				}
			}
		} 
	});
}

function updateBot( botName, gamesPlayedInc, winsInc ) {
	ddb.getItem( getParams( botName ), function( err, data ) {
		if ( err ) {
			console.log( err );
		} else if ( 'Item' in data ) {
			gamesPlayed = parseInt( data.Item.gamesPlayed.N ) + gamesPlayedInc;
			wins = parseInt( data.Item.wins.N ) + winsInc;
			ddb.putItem( putParams( botName, gamesPlayed, wins ), function( err, data ) {
				if ( err ) console.log( err );
				else console.log( botName + "'s games played: " + gamesPlayed.toString() + ", wins: " + wins.toString() );
			});
		} else {
			console.log( "Bot " + botName + " not found.  This shouldn't happen." );
		}
	});
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

function createId(isIrcNick)
{
    var botName = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 15; i++ ) {
    	if( i==0 ) {
	    	botName += charset.charAt(Math.floor(Math.random() * (charset.length-10)));
    	} else {
	    	botName += charset.charAt(Math.floor(Math.random() * charset.length));
    	}	
    }
	// Don't create if it's the phony IRC profile real name/user name.
	if (isIrcNick) {
		// Create record in DynamoDB for this bot's name if it doesn't exist yet.
		ddb.getItem(getParams(botName), function(err, data) {
			if (err) {
				console.log(err);
			} else if ('Item' in data) {
				console.log("Welcome back " + botName);
			} else {
				ddb.putItem(putParams(botName, 0, 0), function(err, data) {
					if (err) console.log(err);
					else console.log("New bot " + botName + " added to leaderboard");
				});
			}
		});
	}

    return botName;
}

function getParams(botName) {
	return {
		TableName: "leaderboard",
		Key: {
			botName: {
				"S": botName
			}
		}
	}
}

function putParams(botName, gamesPlayed, wins) {
	return {
		TableName: "leaderboard",
		Item: {
			botName: {"S": botName},
			gamesPlayed: {"N": gamesPlayed.toString()},
			wins: {"N": wins.toString()}
		}
	}
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
