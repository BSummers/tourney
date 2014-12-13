'use strict';
/*global Handlebars */
console.log('loading...');

var storage=$.localStorage;

var bracket = function() {

	this.id = '';
	this.name = '';
	this.size = '';
	this.levels = '';
	this.entrants = '';
	this.randomize = '';

	this.loadLocalTournaments = function() {
		var localTournaments = storage.keys();
		var tourneyMenuCompiled = Handlebars.compile($('#tourney-menu').html());

		$('#loadTourneyList').empty();

		if (localTournaments.length === 0) {
			$('#loadTourneyList').append('<li><a href="#">No tournaments found.</a></li>');
		} else {
			for (var i = 0; i < localTournaments.length; i += 1) {
				var tournament = storage.get(localTournaments[i]);
				var tourneyData = {target:localTournaments[i], name:tournament.name};
				$('#loadTourneyList').append(tourneyMenuCompiled(tourneyData));
			}
		}
	};

	this.shuffle = function() {
		var m = this.entrants.length, t, i;
		// While there remain elements to shuffle
		while (m) {
			// Pick a remaining element
			i = Math.floor(Math.random() * m--);
			// And swap it with the current element
			t = this.entrants[m];
			this.entrants[m] = this.entrants[i];
			this.entrants[i] = t;
		}
	};

	this.addByes = function() {
		while(this.entrants.length < this.size) {
			this.entrants.reverse();
			this.entrants.push('Bye');
		}
	};

	this.loadBracket = function(bracketID) {
		console.log('loading bracket:'+bracketID);
		this.id = bracketID;


		var tournament = storage.get(this.id);

		this.name = tournament.name;
		this.status = tournament.status;
		this.size = tournament.size;
		this.matches = tournament.matches;
		this.levels = tournament.levels;

		this.entrants = tournament.entrants;
		this.randomize = tournament.randomize;

		this.render();
	};

	this.saveBracket = function() {
		var tData = {
			'name': this.name,
			'entrants':this.entrants,
			'levels':this.levels,
			'matches':this.matches,
			'size':this.size,
			'randomize':this.randomize,
			'status':this.status
		};

		storage.set(this.id, JSON.stringify(tData));
	};

	this.safeName = function(name) {
		var safeName = name.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '-').replace(/^(-)+|(-)+$/g,'');
		var oldSafeName = safeName;

		var i = 0;

		var localTournaments = storage.keys();

		while ($.inArray(safeName, localTournaments) !== -1) {
			i += 1;
			safeName = oldSafeName + '_' + i;
		}

		return safeName;
	};

	this.seed = function() {
		// seed the first round
		var position = 0;
		var tmpEntrants = this.entrants.slice(0);

		for (var i = 0; i < tmpEntrants.length; i += 1) {
			this.entrants[position] = tmpEntrants[i];
			position += 2;
			if (position >= this.size) {
				position = 1;
			}
		}

		var x = 0;
		for (i = 0; i < this.entrants.length; i += 2) {
			this.matches[x].opponents = [this.entrants[i],this.entrants[i+1]];
			x += 1;
		}
	};

	this.render = function() {
		$('#bracket').attr('data-size',this.size).show();
		$('#setup').hide();
		// clear rounds
		$('#bracket').empty();

		for(var i = 1; i <= this.levels; i += 1) {
			var roundData = {'round': i};
			//Compile the template
			var tourneyRoundCompiled = Handlebars.compile($('#tourney-round').html());
			$('#bracket').append(tourneyRoundCompiled(roundData));
		}

		var tourneyChampionCompiled = Handlebars.compile($('#tourney-champion').html());
		$('#bracket').append(tourneyChampionCompiled({'round': i+1}));


		for (i = 0; i < this.matches.length; i += 1) {
			if(this.matches[i].winner && (this.matches[i].child !== 'champion')) {
				if ((i % 2) == 0) {
					this.matches[this.matches[i].child].opponents[0] = this.matches[i].winner;
				} else {
					this.matches[this.matches[i].child].opponents[1] = this.matches[i].winner;
				}
			}
			if(this.matches[i].opponents) {

				var first = {
					name : this.matches[i].opponents[0],
					number : ($.inArray(this.matches[i].opponents[0],this.entrants)) != -1 ? $.inArray(this.matches[i].opponents[0],this.entrants) : ''
				};

				var second = {
					name : this.matches[i].opponents[1],
					number : ($.inArray(this.matches[i].opponents[1],this.entrants)) != -1 ? $.inArray(this.matches[i].opponents[1],this.entrants) : ''
				};

				if (first.name == 'Bye') { first.number = 'bye'; }
				if (second.name == 'Bye') { second.number = 'bye'; }

				if (this.matches[i].opponents[0] === this.matches[i].winner) { first.winner = 1; }
				if (this.matches[i].opponents[1] === this.matches[i].winner) { second.winner = 1; }
				
				var resolved=false;

				var matchData = {'matchnumber': i, 'opponents': [first,second], 'resolved': resolved, 'child': this.matches[i].child};
				//Compile the template
				var matchTemplateCompiled = Handlebars.compile($('#match-template').html());
				$('.round-'+this.matches[i].round).append($(matchTemplateCompiled(matchData)).data('matchData',matchData));
			}
		}

		if (this.matches[this.matches.length-1].winner) {
			var champion = {
				name : this.matches[this.matches.length-1].winner,
				number : ($.inArray(this.matches[this.matches.length-1].winner,this.entrants)) != -1 ? $.inArray(this.matches[this.matches.length-1].winner,this.entrants) : ''
			};
		} 
		
			var champTemplateCompiled = Handlebars.compile($('#champ-template').html());
			$('.round-championship').append($(champTemplateCompiled(champion)));

	};

	this.clearChildren = function(match) {
		while($.isNumeric(this.matches[match].child)) {
			console.log(match);
			this.matches[match].winner = '';
			if (this.matches[match].opponents) {
				this.matches[match].opponents = [];
			}
			match = this.matches[match].child;
		}
		if (this.matches[match].child === 'champion') {
			this.matches[match].winner = '';
			this.matches[match].opponents = [];
		}
		this.saveBracket();
		this.render();
	};

	this.create = function(options) {
		this.name = options.name;
		this.entrants = options.entrants;
		this.randomize = options.randomize;

		this.id = this.safeName(this.name);
		this.status = 1;

		// calculate bracket size from entrants
		this.size = 1;
		do {
			this.size = this.size*2;
		} while (this.size < this.entrants.length);

		// calculate levels and number of matches to be played
		this.levels = Math.log(this.size) / Math.log(2);
		this.matches = new Array((this.size - 1));


		var matchesPerRound = this.size / 2;
		var currentRound = 1;
		var matchPosition=1;
		var childMatch = this.size / 2;

		for (var i=1; i<this.size; i+=1) {
			this.matches[(i-1)] = {};

			this.matches[(i-1)].round = currentRound;
			this.matches[(i-1)].position = matchPosition;
			this.matches[(i-1)].winner = '';
			this.matches[(i-1)].child = childMatch;
			this.matches[(i-1)].opponents = [];

			if(childMatch === this.size - 1) {
				this.matches[(i-1)].child = 'champion';
			}

			if(i%2 === 0) {
				childMatch += 1;
			}

			if ((matchPosition/matchesPerRound) === 1) {
				currentRound+=1;
				matchesPerRound=matchPosition/2;
				matchPosition=0;
			}
			matchPosition+=1;
		}

		if(this.randomize) { this.shuffle(); }
		if(this.entrants.length < this.size) { this.addByes(); }
		this.seed();

		this.saveBracket();
	};


	this.init($('body'));
};


bracket.prototype = {
	events: {
		'click .match'  : 'matchWinner',
		'click .setWinner' : 'setWinner',
		'click .loadTournament' : 'loadTournament',
		'click .removeTournament' : 'removeTournament',
		'click #generate' : 'createTournament',
		'click #newTournament' : 'newTournament',
		'mouseover .team' : 'activateTeam',
		'mouseout .team' : 'deactivateTeam'
	},
	init: function(elem){
		this.$elem = $(elem).eventralize(this.events, this, 'bracket');
	},
	destroy: function() {
		this.$elem.uneventralize(this.events);
	},
	//All functions are passed an extended 'event' object
	matchWinner  : function(event) {
		var match = this.matches[$(event.currentTarget).data('match')];
		match.matchnumber = $(event.currentTarget).data('match');

		//Compile the template
		var matchDecideCompiled = Handlebars.compile($('#match-decide').html());

		$('#matchWinner .modal-body').empty().append(matchDecideCompiled(match));
		$('#matchWinner').modal('show');
	},
	setWinner : function(event) {
		var matchid = $(event.currentTarget).data('match');
		var winner = $(event.currentTarget).data('team');


		this.matches[matchid].winner = winner;

		if (this.matches[matchid].child !== 'champion') {
			if ((matchid % 2) === 0) {
				this.matches[this.matches[matchid].child].opponents[0] = winner;
			} else {
				this.matches[this.matches[matchid].child].opponents[1] = winner;
			}
			this.clearChildren(this.matches[matchid].child);
		}

		this.saveBracket();
		this.render();

	},
	loadTournament : function(event) {
		this.loadBracket($(event.currentTarget).data('target'));
	},
	activateTeam : function(event) {
		if ($(event.currentTarget).data('team') !== '' && !$(event.currentTarget).hasClass("team-bye")) {
			$('.team-'+$(event.currentTarget).data('team')).addClass('active');
		}
	},
	deactivateTeam : function(event) {
		if ($(event.currentTarget).data('team') !== '' && !$(event.currentTarget).hasClass("team-bye")) {
			$('.team-'+$(event.currentTarget).data('team')).removeClass('active');
		}
	},
	removeTournament : function(event) {
		event.stopPropagation();

		if(thisBracket.id === $(event.currentTarget).data('target')) {
			$('#bracket').empty().hide();
		}
		storage.remove($(event.currentTarget).data('target'));
		this.loadLocalTournaments();
	},
	createTournament : function(event) {
		this.create({'name':$('#tName').val(), 'entrants':$('#entrants').val().match(/[^\r\n]+/g), 'randomize':$('#randomize').is(':checked')});
		this.loadLocalTournaments();
		this.render();
	},
	newTournament : function(event) {
		$('#setup form')[0].reset();
		$('#setup').show();
		$('#bracket').hide();
	}
};

var thisBracket = new bracket();
thisBracket.loadBracket('b1');

$( document ).ready(function() {
	thisBracket.loadLocalTournaments();
	console.log('loaded.');
});
