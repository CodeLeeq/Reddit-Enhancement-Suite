addModule('stylesheet', function(module, moduleID) {
	module.moduleName = 'Stylesheet Loader';
	module.description = 'Load stylesheets from other subreddits';
	module.category = 'UI';

/*
	module.options.snippets = {
		type: 'table',
		value: [],
		fields: [{
			name: 'snippet',
			type: 'textarea'
		}, {
			name: 'context',
			type: 'text'
		}]
	};
*/

	module.options.loadSubredditStylesheets = {
		type: 'table',
		value: [],
		fields: [{
			name: 'subreddit',
			type: 'list',
			listType: 'subreddits'
		}, {
			name: 'applyTo',
			type: 'enum',
			values: [{
				name: 'Everywhere',
				value: 'everywhere'
			}, {
				name: 'Everywhere but:',
				value: 'exclude'
			}, {
				name: 'Only on:',
				value: 'include'
			}],
			value: 'everywhere',
			description: 'Apply filter to:'
		}, {
			name: 'applyToSubreddits',
			type: 'list',
			listType: 'subreddits'
		}, {
			name: 'toggleName',
			type: 'text'
		}]
	};

	module.options.documentClasses = {
		type: 'table',
		value: [],
		fields: [{
			name: 'classes',
			type: 'text'
		}, {
			name: 'applyTo',
			type: 'enum',
			values: [{
				name: 'Everywhere',
				value: 'everywhere'
			}, {
				name: 'Everywhere but:',
				value: 'exclude'
			}, {
				name: 'Only on:',
				value: 'include'
			}],
			value: 'everywhere',
			description: 'Apply filter to:'
		}, {
			name: 'applyToSubreddits',
			type: 'list',
			listType: 'subreddits'
		}, {
			name: 'toggleName',
			type: 'text'
		}]
	};

	module.options.subredditClass = {
		type: 'boolean',
		value: true,
		description: 'When browsing a subreddit, add the subreddit name as a class to the body.' +
			'\n\n<br><br>For example, /r/ExampleSubreddit adds <code>body.res-r-examplesubreddit</code>'
	};
	module.options.multiredditClass = {
		type: 'boolean',
		value: true,
		description: 'When browsing a multireddit, add the multireddit name as a class to the body.' +
			'\n\n<br><br>For example, /u/ExampleUser/m/ExampleMulti adds <code>body.res-user-exampleuser-m-examplemulti</code>'
	};
	module.options.usernameClass = {
		type: 'boolean',
		value: true,
		description: 'When browsing a user profile, add the username as a class to the body.' +
			'\n\n<br><br>For example, /u/ExampleUser adds <code>body.res-user-exampleuser</code>'
	};
	module.options.loggedInUserClass = {
		type: 'boolean',
		value: false,
		description: 'When logged in, add your username as a class to the body.' +
			'\n\n<br><br>For example, /u/ExampleUser adds <code>body.res-me-exampleuser</code>'
	};
	module.beforeLoad = function() {
		if (!(module.isEnabled() && module.isMatchURL())) return;

		if (module.options.subredditClass.value) {
			applySubredditClass();
		}
		if (module.options.usernameClass.value) {
			applyUsernameClass();
		}
		if (module.options.multiredditClass.value) {
			applyMultiredditClass();
		}
		applyDocumentClasses();
		loadSubredditStylesheets();

		$(modules['customToggles']).on('activated deactivated', function() {
			applyDocumentClasses();
			loadSubredditStylesheets();
		});
	};

	module.go = function() {
		if (!(module.isEnabled() && module.isMatchURL())) return;

		if (module.options.loggedInUserClass.value) {
			applyLoggedInUserClass();
		}
	}

	function applySubredditClass() {
		var name = RESUtils.currentSubreddit();
		if (name) {
			name = name.toLowerCase();
			RESUtils.addBodyClasses('res-r-' + name);
		}
	};

	function applyMultiredditClass() {
		var name = RESUtils.currentMultireddit();
		if (name) {
			name = name.toLowerCase().replace(/\//g, '-');
			RESUtils.addBodyClasses('res-' + name);
		}
	};

	function applyUsernameClass() {
		var name = RESUtils.currentUserProfile();
		if (name) {
			name = name.toLowerCase();
			RESUtils.addBodyClasses('res-user-' + name);
		}
	};

	function applyLoggedInUserClass() {
		var name = RESUtils.loggedInUser(true);
		if (name) {
			name = name.toLowerCase();
			RESUtils.addBodyClasses('res-me-' + name);
		}
	};

	function applyDocumentClasses() {
		var addClasses = module.options.documentClasses.value
			.filter(function(row) {
				return shouldApply(row[3], row[1], row[2]);
			})
			.map(function(row) {
				return (row[0] || '').split(/[\s,]/);
			});

		var removeClasses = module.options.documentClasses.value
			.filter(function(row) {
				return !shouldApply(row[3], row[1], row[2]);
			})
			.map(function(row) {
				return (row[0] || '').split(/[\s,]/);
			});


		RESUtils.addBodyClasses.apply(RESUtils.documentClasses, addClasses);
		RESUtils.removeBodyClasses.apply(RESUtils.documentClasses, removeClasses);
	}


	function sanitizeSubredditList(uncleanRows) {
		var uncleanValues = uncleanRows.map(function(row) {
				return row[0];
			});

		var subreddits = RESUtils.options.listTypes['subreddits'].sanitizeValues(uncleanValues);
		return subreddits;
	}

	var _loadSubredditStylesheets;
	function loadSubredditStylesheets() {
		if (!document.head) {
			clearTimeout(_loadSubredditStylesheets);
			_loadSubredditStylesheets = setTimeout(loadSubredditStylesheets, 1)
			return;
		}

		var remove = module.options.loadSubredditStylesheets.value
			.filter(function(row) {
				return !shouldApply(row[3], row[1], row[2]);
			});
		remove = sanitizeSubredditList(remove);


		var add = module.options.loadSubredditStylesheets.value
			.filter(function(row) {
				return shouldApply(row[3], row[1], row[2]);
			})
		add = sanitizeSubredditList(add);
		add = add.filter(function(subreddit) {
			return remove.indexOf(subreddit) === -1;
		});

		var addElements = add.filter(function(subreddit) {
				var element = findSubredditStylesheetElement(subreddit);
				return element.length === 0;
			})
			.map(function(subreddit) {
				var element = createSubredditStylesheetElement(subreddit);
				return element;
			}).reduce(function(collection, element) {
				return collection.add(element);
			}, $());

		var removeElements = remove.map(function(subreddit) {
				return findSubredditStylesheetElement(subreddit);
			})
			.reduce(function(collection, elements) {
				return collection.add(elements);
			}, $());


		$(document.head).append(addElements);
		removeElements.remove();

	}

	function findSubredditStylesheetElement(findSubreddit) {
		if (!findSubreddit) return $();
		findSubreddit = findSubreddit.toLowerCase();
		var element = $('link[rel=stylesheet]')
			.filter(function() {
				var subreddit = $.data(this, 'res-stylesheet');
				if (subreddit && findSubreddit === subreddit.toLowerCase()) {
					return true;
				}
			});
		return element;
	}

	function createSubredditStylesheetElement(subreddit) {
		var element = $('<link rel="stylesheet">')
			.data('res-stylesheet', subreddit)
			.attr('href', '/r/' + subreddit + '/stylesheet.css');
		return element;
	}

	function shouldApply(toggle, applyTo, applyList) {
		if (toggle && !modules['customToggles'].toggleActive(toggle)) return false;

		var subreddit = RESUtils.currentSubreddit();
		if (!subreddit) return true;

		var all = (applyList.indexOf('all') !== -1);
		switch (applyTo) {
			case 'exclude':
				if ((applyList.indexOf(subreddit) !== -1) || all) {
					return false;
				}
				break;
			case 'include':
				if (!((applyList.indexOf(subreddit) !== -1) || all)) {
					return false;
				}
				break;
		}
		return true;
	}
});