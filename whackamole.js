/*

	Whack-A-Mole v0
	copyright 2010 Christopher Scott Hernandez

	JavaScript/HTML game written as a challenge by my friend Rob Allen at work.
	
	This document is licensed as free software under the terms of the
	MIT License: http://www.opensource.org/licenses/mit-license.php 
	
*/



// our one global
// ...thought about doing it like jquery
// what with the whole window.whackamole = whackamole bit, but... 
// i dunno... i like this better.. and i have to be different... :)
var whackamole = whackamole || (function(window, undefined) {
	

	// booleans, ints, and timers oh my!
	var game, score, popping, startTime, currentTime, clicked, moles, gameTimeout, hits = 0;
	
	// configuration options
	// TODO: make game configurable, by passing in options object like jquery plugin	
	var	hidingInterval = 750,
		poppingInterval = 1500,
		moleLimit = 10,
		quotes = ['That\'s weird...',
				'It\'s never done that before.',
				'It worked yesterday.',
				'How is that possible?',
				'It must be a hardware problem.',
				'What did you type in wrong to get it to crash?',
				'There is something funky in your data.',
				'I haven\'t touched that module in weeks!',
				'You must have the wrong version.',
				'It\'s just some unlucky coincidence.',
				'I can\'t test everything!',
				'THIS can\'t be the source of THAT.',
				'It works, but it hasn\'t been tested.',
				'Somebody must have changed my code.',
				'Did you check for a virus on your system?',
				'Even though it doesn\'t work, how does it feel?',
				'You can\'t use that version on your system.',
				'Why do you want to do it that way?',
				'Where were you when the program blew up?',
				'It works on my machine.'];

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        function getPersonClass() {
            switch(getRandomInt(0, 5)) {
                case 0: return 'devon';
                case 1: return 'jeff';
                case 2: return 'ken';
                case 3: return 'matt';
                case 4: return 'ryan';
            }
        }

        function getLiveClass() {
            return 'wam-pesky-mole alive_' + getPersonClass();
        }
		
	// utility function to get computed style
	// copied from a google search ;)
	function getStyle(el, cssprop){
		if (el.currentStyle) {
			return el.currentStyle[cssprop];
		} else if (document.defaultView && document.defaultView.getComputedStyle) {
			return document.defaultView.getComputedStyle(el, "")[cssprop];
		}
	}
	
	// main game methods
	// at first I was using a constructor like Mole()
	// but it seemed stupid to be calling new Mole() only once
	game = {
		mode: "start",
		// is it live? or live?
		live: function() {
			this.mole.className = getLiveClass();
			this.mole.clicked = false;
			$(this.quote).text(_.sample(quotes, 1));
			this.mode = "main";
		},
		// the violence
		kill: function() {
			var currentTime = (new Date).getTime();
			score += (Math.floor( ( ( poppingInterval - (currentTime - startTime) ) / poppingInterval) * 100 )) * 10;
			hits++;
			this.mole.className = this.mole.className.replace('alive', 'dead').replace('wam-pesky-mole', 'wam-pesky-mole-dead');
			this.mode = "dead";
		},
		move: function() {
			moles++;
			clicked = false;
			var top = Math.floor(Math.random() * (parseInt(getStyle(this.stage, "height")) - parseInt(getStyle(this.mole, "height")) ));
			var left = Math.floor(Math.random() * (parseInt(getStyle(this.stage, "width")) - parseInt(getStyle(this.mole, "width")) ));

            this.mole.style.top = top + "px";
            this.mole.style.left = left + "px";

			this.quote.css('top', top - 70 + "px");
			this.quote.css('left', (left - 50) + "px");

			startTime = (new Date).getTime();
		},
		// this seems odd; this is what you get when writing code while speepy
		// let's leave it in... i don't think the game works without it. 
		togglePop: function() {
			$(this.mole).css('display', (popping) ? "block" : "none");
			this.quote.css('display', (popping) ? "block" : "none");
		},
		reset: function() {
			game.mode = "main";
			popping = false;
			hits = score = moles = 0;
		},
		// yeah, so.. these two don't really do a whole lot
		showStart: function() {
			this.startScreen.style.display = "block";
		},
		showScoreboard: function() {
			this.sb.style.display = "block";
		}
	}
	
	// main setup run once, instantiates three entities:
	// the "pesky" mole, the scoreboard, and the game stage
	// a lot of DOM scripting; probably rife with areas for optimization
	function setup(elementId) {
		
		var mole, sb, stage, quote;

		var container = $('#wam-game');
		container.css('width', Math.max(
			Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
			Math.max(document.body.offsetHeight, document.documentElement.offsetHeight),
			Math.max(document.body.clientHeight, document.documentElement.clientHeight)) - 50);

		container.css('height', Math.max(
			Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
			Math.max(document.body.offsetWidth, document.documentElement.offsetWidth),
			Math.max(document.body.clientWidth, document.documentElement.clientWidth)) - 50);

		
		// the mole
		mole = game.mole = document.createElement('div');
		mole.className = getLiveClass();
		mole.style.display = "none";
		// who needs cross-browser event handling?
		mole.onclick = function() {
			if (!game.mole.clicked) {
				game.kill();
				game.mole.clicked = true;
				game.scoreboard.update();
				window.clearTimeout(gameTimeout);
				step();
			}
		};

		quote = game.quote = $('<span/>');
		quote.addClass('quote');
		quote.text(_.sample(quotes, 1));
		quote.css('display', 'none');

		// the scoreboard
		sb = game.scoreboard = document.createElement("div");
		sb.className = "wam-scoreboard";
		sb.update = function() {
			this.innerHTML = "points: " + score + "<br />Moles: " + hits + " / " + moles;
		}
		
		// the start screen
		ss = game.startScreen = document.createElement("div");
		ss.className = "wam-startScreen";
		ss.innerHTML = "start";
		ss.style.display = "none";
		ss.onclick = function() {
			game.mode = "main";
			this.style.display = "none";
			step();
		}
		
		// the end screen 
		// this could really be called the "play again?" button
		// but i opted for brevity
		es = game.endScreen = document.createElement("div");
		es.className = "wam-endScreen";
		es.style.display = "none";
		es.innerHTML = "Play again?";
		es.onclick = function() {
			game.reset();
			game.mode = "main"
			this.style.display = "none";
			game.startScreen.display = "none";
			step();
			
		}
		
		// the game stage
		stage = game.stage = document.getElementById(elementId);
		stage.style.position = "relative";
	
		// build the thing..
		// i dunno, this just seems like it's screaming for a FOR loop
		// but i'm just lazy... i admit it.
		stage.appendChild(ss);
		stage.appendChild(sb);
		stage.appendChild(mole);
		stage.appendChild(quote.get(0));
		stage.appendChild(es);
		
	}
	
	// at first I was calling this "loop", but it wasn't really a loop
	// but more like a controller for the game, that various
	// objects would call to "step" the game forward
	// this could probably be refactored into something much more elegant
	// ...maybe for a rainy day...
	function step() {
		switch(game.mode) {
			case "start":
				game.showStart();
				break;
			case "dead":
				gameTimeout = setTimeout(function(){
					
					step();
				}, 500);
				game.mode = "main";
				break;
			case "main":
				game.scoreboard.update();
				if (moles >= moleLimit) {
					game.mode = "end";
					gameTimeout = setTimeout(step, 10);
					break;
				}
				game.live();
				game.togglePop();
				if (popping) game.move();
				popping = (popping) ? false : true;
				gameTimeout = setTimeout(step, (popping) ? hidingInterval : poppingInterval);
				break;
			case "end":
			default:
				game.scoreboard.innerHTML = "Final Score: " + score + "<br />Moles: " + hits + " / " + moles;
				game.endScreen.style.display = "block";
				break;
		}
	}
	
	// public interface
	// not really sure I need anything but "setup"
	// but it just seems any self respecting game should at least
	// have a few helpful public methods... i dunno... 
	// if the game got bigger...maybe it would make more sense...
	// anyhow...
	return {
		setup: function(element) {
			setup(element);
			this.start();
		},
		start: function() {
			game.reset();
			game.mode = "start";
			step();
		},
		stop: function() {
			game.mode = "dead";
			moles = moleLimit + 1;
			window.clearTimeout(gameTimeout);
			step();
		}
	};
	
})(window);