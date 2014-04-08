'use strict';
/*global Handlebars */
console.log('loaded.');

var storage=$.localStorage;

var loadLocalTournaments = function() {
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

var bracket = function() {

	this.id = '';
	this.name = '';
	this.size = '';
	this.levels = '';
	this.matches = '';
	this.entrants = '';
	this.randomize = '';

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
		this.id = bracketID;

		var tournament = storage.get(this.id);

		this.name = tournament.name;
		this.status = tournament.status;
		this.size = tournament.size;
		this.matches = tournament.matches;
		this.levels = tournament.levels;

		this.entrants = tournament.entrants;
		this.randomize = tournament.randomize;
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
	};

	this.render = function() {
		$('#bracket').attr('data-size',this.size).show();
		$('#setup').hide();
		// clear round 1
		$('.round-1').empty();

		for (var i = 0; i < this.entrants.length; i += 2) {
			var matchData = [{name:this.entrants[i], number:i+1 }, {name:this.entrants[i+1], number:i+2 }];
			//Get the HTML from the template   in the script tag
			var matchTemplateSource = $('#match-template').html();
			//Compile the template
			var matchTemplateCompiled = Handlebars.compile(matchTemplateSource);
			$('.round-1').append($(matchTemplateCompiled(matchData)).data('matchData',matchData));
		}
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
		this.matches = this.size - 1;

		if(this.randomize) { this.shuffle(); }
		if(this.entrants.length < this.size) { this.addByes(); }
		this.seed();

		this.saveBracket();
	};
};

$('#newTournament').click(function () {
	$('#setup').show();
	$('#bracket').hide();
});

$('body').on('click', 'a.loadTournament', function() {
	var thisBracket = new bracket();
	thisBracket.loadBracket($(this).data('target'));
	thisBracket.render();
});

$('body').on('click', 'a.removeTournament', function() {
	event.stopPropagation();
	storage.remove($(this).data('target'));
	loadLocalTournaments();
});

$('#generate').click(function () {
	var name = $('#tName').val();
	var entrants = $('#entrants').val().match(/[^\r\n]+/g);

	var thisBracket = new bracket();
	thisBracket.create({'name':name, 'entrants':entrants, 'randomize':$('#randomize').is(':checked')});

	loadLocalTournaments();

	thisBracket.render();


});

$('body').on('click', 'div.match', function() {
	var matchData = $(this).data('matchData');
	//Get the HTML from the template   in the script tag
	var matchDecideSource = $('#match-decide').html();
	//Compile the template
	var matchDecideCompiled = Handlebars.compile(matchDecideSource);

	$('#matchWinner .modal-body').empty().append(matchDecideCompiled(matchData));

	$('#matchWinner').modal('show');
	//debugger;

});


$( document ).ready(function() {
	loadLocalTournaments();
});
