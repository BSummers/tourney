'use strict';
/*global Handlebars */
/*global TreeModel */
console.log('loaded.');

// hint: TreeModel, tree and root are
// globally available on this page
var tree = new TreeModel();

var bracket = function(options) {

	var vars = {
		name: 'Bracket tournament',
		size: 0,
		levels: 0,
		matches: 0,
		entrants: false,
		randomize: false,
		sizes: new Array(1,2,4,8,16,32,64)
	};

	var root = this;

	this.shuffle = function() {
		var m = vars.entrants.length, t, i;
		// While there remain elements to shuffle…
		while (m) {
			// Pick a remaining element…
			i = Math.floor(Math.random() * m--);
			// And swap it with the current element.
			t = vars.entrants[m];
			vars.entrants[m] = vars.entrants[i];
			vars.entrants[i] = t;
		}
	};

	this.construct = function(options){
		$.extend(vars , options);

		$.each(vars.sizes, function(index, size) {
			if (vars.entrants.length <= size) {
				vars.size = size;
				return false;
			}
		});

		vars.levels = Math.log(vars.size) / Math.log(2);
		vars.matches = vars.size - 1;

		if(vars.randomize) {
			this.shuffle();
		}

		while(vars.entrants.length < vars.size) {
			vars.entrants.reverse();
			vars.entrants.push('Bye');
		}

		var position = 0;
		var tmpEntrants = vars.entrants;

		for (var i = 0; i < tmpEntrants.length; i += 1) {
			vars.entrants[position] = tmpEntrants[i];
			position += 2;
			if (position >= vars.size) {
				position = 1;
			}
		}

		var troot = tree.parse({id: 1});
		console.log(troot);
		//debugger;
		this.entrants = vars.entrants;
		this.size = vars.size;


	};


	this.construct(options);
};

$('#generate').click(function () {
	var entrants = $('#entrants').val().match(/[^\r\n]+/g);

	var thisBracket = new bracket({'entrants':entrants, 'randomize':$('#randomize').is(':checked')});

	console.log(thisBracket);

	$('#bracket').attr('data-size',thisBracket.size);

	// clear round 1
	$('.round-1').empty();

	for (var i = 0; i < thisBracket.entrants.length; i += 2) {
		var matchData = [{name:thisBracket.entrants[i], number:i+1 }, {name:thisBracket.entrants[i+1], number:i+2 }];
		//Get the HTML from the template   in the script tag
		var matchTemplateSource = $('#match-template').html();
		//Compile the template
		var matchTemplateCompiled = Handlebars.compile(matchTemplateSource);
		$('.round-1').append($(matchTemplateCompiled(matchData)).data('matchData',matchData));
	}

	//debugger;
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
