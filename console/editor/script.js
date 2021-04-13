// Begin page sequence once user is signed in
handleAuth(uid => {
	console.log('Signed In', uid);
	loadPage(uid);
});

// Handle authentication using Firebase and GitHub
function handleAuth(callback) {
	window.addEventListener('DOMContentLoaded', () => {

		// Initialize the FirebaseUI Widget using Firebase.
		var ui = new firebaseui.auth.AuthUI(firebase.auth());

		function handleSignedInUser(user) {

			// Display page content
			$('title').text('IHS Artists Console');
			$('#auth').css('display', 'none');
			$('#console').css('display', 'block');

			callback(user.uid);
		}

		function handleSignedOutUser() {

			// Display Sign In UI
			$('title').text('Sign In | IHS Artists Console');
			$('#auth').css('display', 'block');
			$('#console').css('display', 'none');

			ui.start('#auth-ui', {
				callbacks: {
					signInSuccessWithAuthResult: function (authResult) {
						// Save GitHub access token
						firebase.database().ref('users/' + authResult.user.uid + '/auth/username').set(authResult.additionalUserInfo.username);
						firebase.database().ref('users/' + authResult.user.uid + '/auth/token').set(authResult.credential.accessToken);
						// Do not redirect.
						return false;
					},
					uiShown: function () {
						$('#auth-loader').css('display', 'none');
					}
				},
				signInFlow: 'redirect',
				signInOptions: [{
					provider: firebase.auth.GithubAuthProvider.PROVIDER_ID,
					scopes: ['repo']
				}]
			});
		}

		firebase.auth().onAuthStateChanged(function (user) {
			user ? handleSignedInUser(user) : handleSignedOutUser();
		});

		$('#sign-out').click(function () {
			firebase.auth().signOut();
		});
	});
}

// Initialize some global variables
var uid;
var selected = null;
var selectedYear = null;
var deviceType = 'desktop';
var fadeTimer;
var containerTimer;
var draftData = [];
var draftId = 0;
var customImageCache = {};
var websiteBaseUrl = 'https://ihsartists.net/';
var token = null;

// Initial loading of the page
function loadPage(userId) {
	uid = userId;

	// Add arrow key events for moving artists
	window.addEventListener("keydown", function (e) {
		if (selected !== null) {
			// space and arrow keys
			if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
				//e.preventDefault();
			}
			handleSelectedKey(e.keyCode);
		}
	}, false);

	// Add handler for clicking off of artist
	$(document).click(function () {
		if (selected !== null) {
			$('.selected').removeClass('selected');
			selected = null;
			selectedYear = null;
		}
	});

	// Load data from Firebase and render all of it
	loadData(() => {
		$('title').text(draftData[draftId].name + ' | IHS Artists Console');
		$('#draft-title').val(draftData[draftId].name);

		prepareTitleInput();
		prepareMenus();
		prepareMenuOptions();
		renderFrontData();
	});
}

// Go to main draft selector menu
function goHome() {
	window.location = '/console/';
}

//Load the draft data from Firebase
function loadData(callback) {
	firebase.database().ref('users/' + uid + '/drafts').once('value').then(snapshot => {
		if (snapshot.val()) {

			draftData = JSON.parse(snapshot.val());

			//Find the draft ID from the url parameters (make sure it exists)
			let searchParams = new URLSearchParams(window.location.search);
			if (searchParams.has('id')) {
				draftId = parseInt(searchParams.get('id'));
				if (draftData[draftId]) {
					if (draftData[draftId].name) {
						callback();
					} else {
						goHome();
					}
				} else {
					goHome();
				}
			} else {
				goHome();
			}

		} else {
			goHome();
		}
	});
}

// Save the updated data to Firebase
function saveData() {
	console.log('Data saved', draftData);
	firebase.database().ref('users/' + uid + '/drafts').set(JSON.stringify(draftData));
}

// Displays a temporary alert bar at the bottom of the window
function bottomAlert(text, color, time) {
	$('#alert-bar-container').css('display', 'block');
	if (fadeTimer) {
		clearTimeout(fadeTimer);
		clearTimeout(containerTimer);
		$('#alert-bar').css('opacity', 0);

		setTimeout(() => {
			$('#alert-bar').text(text).css('background', color).css('opacity', 1);
		}, 200);

	} else {
		$('#alert-bar').text(text).css('background', color).css('opacity', 1);
	}

	fadeTimer = setTimeout(() => {
		$('#alert-bar').css('opacity', 0);
		containerTimer = setTimeout(() => {
			$('#alert-bar-container').css('display', 'none');
		}, 250);
	}, time);
}

// Hides the confirm box - should be called at end of callback
function closeConfirmBox() {
	$('#page-container').css('filter', 'none');
	$('#confirm-box-container').css('display', 'none');
	$('#background-blur').css('display', 'none');
	$('#top-bar-container').css('top', '0px');
}

// Initialize some global functions for confirm box callback
var confirmCancel = function () { };
var confirmDelete = function () { };

// Displays a confirm box over the screen with callback for different buttons
function confirmBox(title, desc, deleteText, cancelText, deleteFunction, cancelFunction) {

	$('#confirm-box-title').text(title);
	$('#confirm-box-description').text(desc);
	$('#confirm-button-delete').text(deleteText);
	$('#confirm-button-cancel').text(cancelText);

	$('#page-container').css('filter', 'blur(3px)');
	$('#confirm-box-container').css('display', 'block');
	$('#background-blur').css('display', 'block');
	$('#top-bar-container').css('top', '-90px');

	confirmCancel = cancelFunction;
	confirmDelete = deleteFunction;
}

// Checks new names for errors and then updates data
function renameDraft(text) {
	if (draftData[draftId].name != text.trim()) {
		if (text.trim() != '') {
			if (text.trim().length < 24) {
				draftData[draftId].name = text.trim();
				bottomAlert('Renamed.', '#757575', 3000);
			} else {
				bottomAlert('Error: too long.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: please enter a name.', '#ef5350', 3000);
		}
	}
	$('#draft-title').val(draftData[draftId].name);
	$('title').text(draftData[draftId].name + ' | IHS Artists Console');

	saveData();
}

// Checks new names for errors and then updates data
function renameYear(id, text) {
	if (draftData[draftId].data.frontData.years[id].name != text.trim()) {
		if (text.trim() != '') {
			if (text.trim().length < 24) {
				draftData[draftId].data.frontData.years[id].name = text.trim();
				bottomAlert('Renamed.', '#757575', 3000);
			} else {
				bottomAlert('Error: too long.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: please enter a name.', '#ef5350', 3000);
		}
	}
	$('#year-' + id + ' .year-name').val(draftData[draftId].data.frontData.years[id].name);

	saveData();
}

// Runs a preview of the draft in a new window
function previewDraft() {
	window.open('./preview?id=' + draftId, '_blank');
}

var currentMenu;

// Hides the specified menu section
function hideMenuSection(menuSection) {
	menuSection.children('.menu-section-title').css('background', 'none').off('mouseenter mouseleave').hover(function () {
		$(this).css('background', '#eeeeee');
		if (currentMenu) {
			showMenuSection($(this));
		}
	}, function () {
		$(this).css('background', 'none');
	});
	menuSection.children('.menu-section-options').css('display', 'none');
	$('html').off('click');
	menuSection.off('click');
	currentMenu = null;
}

// Opens menu when called
function showMenuSection(menuTitle) {

	if (currentMenu) {
		hideMenuSection($('#' + currentMenu));
	}

	var menuSection = menuTitle.parent();
	currentMenu = menuSection.attr('id');

	menuTitle.css('background', '#e3f2fd').hover(function () {
		menuTitle.css('background', '#e3f2fd');
	}, function () {
		menuTitle.css('background', '#e3f2fd');
	});

	menuSection.children('.menu-section-options').css('display', 'block');

	$('html').click(function () {
		hideMenuSection(menuSection);
	});
	menuSection.click(function (event) {
		event.stopPropagation();
	});
}

// Opens menus on click event
function prepareMenus() {
	$('.menu-section-title').click(function () {
		showMenuSection($(this));
	});
	$('.menu-section-title').hover(function () {
		if (currentMenu) {
			showMenuSection($(this));
		}
	});
}

// Functions to be run when selected in the menu
var optionFunctions = {
	new: function () {
		goHome();
	},
	open: function () {
		goHome();
	},
	duplicate: function () {
		//Initialize the new draft with the same data
		var newId = draftData.length;
		draftData[newId] = Object.assign({}, draftData[draftId], { name: 'Copy of ' + draftData[draftId].name });
		saveData();

		bottomAlert('Draft duplicated.', '#26a69a', 1000);

		setTimeout(function () {
			window.location = '?id=' + (draftData.length - 1);
		}, 1000);
	},
	rename: function () {
		$('#draft-title').click();
		$('#draft-title').focus();
	},
	delete: function () {
		confirmBox('Are you sure you want to delete this draft?', 'This cannot be undone.', 'Delete', 'Cancel', function () {
			var removed = draftData.splice(draftId, 1);
			$('#content').html('');

			bottomAlert('Draft deleted.', '#ec407a', 500);

			saveData();
			closeConfirmBox();

			setTimeout(function () {
				goHome();
			}, 500);
		}, function () {
			closeConfirmBox();
		});
	},
	preview: function () {
		previewDraft();
	},
	publish: function () {
		publishDraft();
	},
	signout: function () {
		firebase.auth().signOut();
	},

	up: function () {
		if (selected !== null) {
			handleSelectedKey(38);
		}
	},
	down: function () {
		if (selected !== null) {
			handleSelectedKey(40);
		}
	},
	left: function () {
		if (selected !== null) {
			handleSelectedKey(37);
		}
	},
	right: function () {
		if (selected !== null) {
			handleSelectedKey(39);
		}
	},
	openArtist: function () {
		handleSelectedKey(13);
	},
	deleteArtist: function () {
		handleSelectedKey(8);
	},

	desktop: function () {
		if (deviceType == 'mobile') {
			deviceType = 'desktop';
			renderFrontData();
			bottomAlert('You are now editing for desktop.', '#42a5f5', 4000);
		}
	},
	mobile: function () {
		if (deviceType == 'desktop') {
			deviceType = 'mobile';
			renderFrontData();
			bottomAlert('You are now editing for mobile.', '#42a5f5', 4000);
		}
	},
	fullscreen: function () {
		var fullscreen = $('#menu-option-fullscreen');
		if (fullscreen.text() == 'Fullscreen') {
			var elem = document.documentElement;
			if (elem.requestFullscreen) {
				elem.requestFullscreen();
				fullscreen.text('Exit fullscreen');
			} else if (elem.mozRequestFullScreen) { /* Firefox */
				elem.mozRequestFullScreen();
				fullscreen.text('Exit fullscreen');
			} else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
				elem.webkitRequestFullscreen();
				fullscreen.text('Exit fullscreen');
			} else if (elem.msRequestFullscreen) { /* IE/Edge */
				elem.msRequestFullscreen();
				fullscreen.text('Exit fullscreen');
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) { /* Firefox */
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
				document.webkitExitFullscreen();
			} else if (document.msExitFullscreen) { /* IE/Edge */
				document.msExitFullscreen();
			}
			fullscreen.text('Fullscreen');
		}
	},

	year: function () {
		draftData[draftId].data.frontData.years[Object.keys(draftData[draftId].data.frontData.years).length] = {
			name: 'Untitled',
			desktop: [],
			mobile: []
		};
		saveData();
		renderFrontData();
		bottomAlert('Year created.', '#26a69a', 3000);
	},
	artist: function () {
		createArtist(draftData[draftId].data.frontData.years.length - 1);
	}
}

// Run specific function on menu option click
function prepareMenuOptions() {
	$('.menu-option').click(function () {
		var optionName = $(this).attr('id').split('-')[2];

		if (optionFunctions[optionName]) {
			optionFunctions[optionName]();
		}
	});
}

// Initializes the draft name input element so it selects all on focus
function prepareTitleInput() {
	$("#draft-title").focus(
		function () {
			$(this).select();
		}
	).blur(
		function () {
			renameDraft($(this).val());
		}
	).keyup(
		function (e) {
			if (e.keyCode == 13) {
				$(this).trigger('blur');
			}
		}
	);
}

// Initializes the control buttons and inputs of the draft
function prepareButtons() {

	// Initialize the year name input to select all on click and rename (with logic) on click out
	$('.year-name').focus(function () {
		$(this).select();
	}).blur(function () {
		renameYear(parseInt($(this).parent().attr('id').split('-')[1]), $(this).val());
	}).keyup(function (e) {
		if (e.keyCode == 13) {
			$(this).trigger('blur');
		}
	});

	// Delete button next to year
	$('.year-delete').click(function () {
		var yearId = parseInt($(this).parent().attr('id').split('-')[1]);
		confirmBox('Are you sure you want to delete "' + draftData[draftId].data.frontData.years[yearId].name + '"?', 'All the artists within will also be deleted. This cannot be undone.', 'Delete', 'Cancel', function () {

			// Delete artists within
			var artists = JSON.parse(JSON.stringify(draftData[draftId].data.frontData.years[yearId].desktop));
			for (let i = 0; i < artists.length; i++) {
				deleteArtist(artists[i], yearId);
			}

			draftData[draftId].data.frontData.years.splice(yearId, 1);

			renderFrontData();
			bottomAlert('Year deleted.', '#ec407a', 3000);
			saveData();
			closeConfirmBox();

		}, function () {
			closeConfirmBox();
		});
	});

	// Move year up one spot
	$('.year-up').click(function () {
		var yearId = parseInt($(this).parent().attr('id').split('-')[1]);
		if (draftData[draftId].data.frontData.years[yearId + 1]) {
			var yearAbove = draftData[draftId].data.frontData.years[yearId + 1];
			draftData[draftId].data.frontData.years[yearId + 1] = draftData[draftId].data.frontData.years[yearId];
			draftData[draftId].data.frontData.years[yearId] = yearAbove;
			saveData();
			renderFrontData();
			bottomAlert('Year moved up.', '#2196f3', 3000);
		}
	});

	// Move year down one spot
	$('.year-down').click(function () {
		var yearId = parseInt($(this).parent().attr('id').split('-')[1]);
		if (draftData[draftId].data.frontData.years[yearId - 1]) {
			var yearBelow = draftData[draftId].data.frontData.years[yearId - 1];
			draftData[draftId].data.frontData.years[yearId - 1] = draftData[draftId].data.frontData.years[yearId];
			draftData[draftId].data.frontData.years[yearId] = yearBelow;
			saveData();
			renderFrontData();
			bottomAlert('Year moved down.', '#2196f3', 3000);
		}
	});

	// Add an artist to a year
	$('.year-add').click(function () {
		event.stopPropagation();
		var yearId = parseInt($(this).parent().attr('id').split('-')[1]);
		createArtist(yearId);
	});

	// Select/deselect artist card on click
	$('.artist-card').click(function () {
		event.stopPropagation();

		var artistId = parseInt($(this).attr('id').split('-')[1]);
		var yearId = parseInt($(this).parent().attr('id').split('-')[1]);

		if ($('#artist-' + artistId).hasClass('selected')) {
			$('.artist-card').removeClass('selected');
			selected = null;
			selectedYear = null;
		} else {
			$('.artist-card').removeClass('selected');
			$('#artist-' + artistId).addClass('selected');
			selected = artistId;
			selectedYear = yearId;
		}
	});
}

// Handles the key movements that move the selected
function handleSelectedKey(key) {

	var yearIndexDesktop = draftData[draftId].data.frontData.years[selectedYear].desktop.indexOf(selected);
	var yearIndexMobile = draftData[draftId].data.frontData.years[selectedYear].mobile.indexOf(selected);
	var yearIndex = deviceType === 'desktop' ? yearIndexDesktop : yearIndexMobile;
	var yearLength = draftData[draftId].data.frontData.years[selectedYear][deviceType].length;
	var perRow = deviceType === 'desktop' ? 5 : 3;

	// Move left
	if (key === 37) {
		if (yearIndex % perRow > 0) {
			var artistLeft = draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex - 1];
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex - 1] = selected;
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex] = artistLeft;

			saveData();
			renderFrontData();
			$('html').scrollTop($('#artist-' + selected).offset().top - 300);
		}
	}
	// Move up
	if (key === 38) {
		if (yearIndex > perRow - 1) {
			var artistUp = draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex - perRow];
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex - perRow] = selected;
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex] = artistUp;

			saveData();
			renderFrontData();
			$('html').scrollTop($('#artist-' + selected).offset().top - 300);
		}
		else if (yearIndex < perRow && selectedYear < draftData[draftId].data.frontData.years.length - 1) {
			draftData[draftId].data.frontData.years[selectedYear].desktop.splice(yearIndexDesktop, 1);
			draftData[draftId].data.frontData.years[selectedYear].mobile.splice(yearIndexMobile, 1);

			selectedYear++;

			draftData[draftId].data.frontData.years[selectedYear].desktop.push(selected);
			draftData[draftId].data.frontData.years[selectedYear].mobile.push(selected); saveData();

			saveData();
			renderFrontData();
			$('html').scrollTop($('#artist-' + selected).offset().top - 300);
			bottomAlert('Moved to year: ' + draftData[draftId].data.frontData.years[selectedYear].name, '#ff7043', 3500);
		}
	}
	// Move right
	if (key === 39) {
		if (yearIndex % perRow < perRow - 1 && yearIndex !== yearLength - 1) {
			var artistRight = draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex + 1];
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex + 1] = selected;
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex] = artistRight;

			saveData();
			renderFrontData();
			$('html').scrollTop($('#artist-' + selected).offset().top - 300);
		}
	}
	// Move down
	if (key === 40) {
		if (yearIndex < perRow * Math.floor((yearLength - 1) / perRow)) {
			var artistDown = draftData[draftId].data.frontData.years[selectedYear][deviceType][Math.min(yearIndex + perRow, yearLength - 1)];
			draftData[draftId].data.frontData.years[selectedYear][deviceType][Math.min(yearIndex + perRow, yearLength - 1)] = selected;
			draftData[draftId].data.frontData.years[selectedYear][deviceType][yearIndex] = artistDown;

			saveData();
			renderFrontData();
			$('html').scrollTop($('#artist-' + selected).offset().top - 300);
		}
		else if (yearIndex > perRow * Math.floor((yearLength - 1) / perRow) - 1 && selectedYear > 0) {
			draftData[draftId].data.frontData.years[selectedYear].desktop.splice(yearIndexDesktop, 1);
			draftData[draftId].data.frontData.years[selectedYear].mobile.splice(yearIndexMobile, 1);

			selectedYear--;

			draftData[draftId].data.frontData.years[selectedYear].desktop.push(selected);
			draftData[draftId].data.frontData.years[selectedYear].mobile.push(selected); saveData();

			saveData();
			renderFrontData();
			$('html').scrollTop($('#artist-' + selected).offset().top - 300);
			bottomAlert('Moved to year: ' + draftData[draftId].data.frontData.years[selectedYear].name, '#ff7043', 3500);
		}
	}

	// Delete
	if (key === 8) {
		var name = draftData[draftId].data.frontData[selected].name;
		confirmBox('Are you sure you want to delete "' + name + '"?', 'This cannot be undone.', 'Delete', 'Cancel', function () {

			deleteArtist(selected, selectedYear);

			selected = null;
			selectedYear = null;

			closeConfirmBox();
			bottomAlert('Artist deleted: ' + name, '#ec407a', 3000);

		}, function () {
			closeConfirmBox();
		});
	}

	// Edit
	if (key === 13) {
		window.location = './artist?id=' + draftId + '&a=' + selected;
	}
}

// Creates a new artist and adds it to the page
function createArtist(yearId) {
	var artistId = parseInt(Object.keys(draftData[draftId].data.frontData)[Object.keys(draftData[draftId].data.frontData).length - 2]) + 1;

	draftData[draftId].data.frontData.years[yearId].mobile.push(artistId);
	draftData[draftId].data.frontData.years[yearId].desktop.push(artistId);

	draftData[draftId].data.frontData[artistId] = {
		name: 'Untitled Artist',
		link: [0, 0],
		newThumb: {
			hasThumb: false
		}
	}
	draftData[draftId].data.artistData[artistId] = {
		name: 'Untitled Artist',
		galleries: [
			{
				name: '1',
				order: [0]
			}
		],
		images: {
			0: {
				name: "Artwork description",
				type: "image",
				newImage: {
					hasImage: false
				},
				newThumb: {
					hasThumb: false
				}
			}
		},
		link: [0, 0],
		statement: {
			type: 'text',
			content: 'Artist statement.'
		}
	}

	selected = artistId;
	selectedYear = yearId;

	saveData();
	renderFrontData();
	bottomAlert('New artist created.', '#009688', 3000);

	$('html').scrollTop($('#artist-' + artistId).offset().top - 400);
}

// Deletes the artist with a specific id
function deleteArtist(artistId, yearId) {

	var yearIndexDesktop = draftData[draftId].data.frontData.years[yearId].desktop.indexOf(artistId);
	var yearIndexMobile = draftData[draftId].data.frontData.years[yearId].mobile.indexOf(artistId);

	draftData[draftId].data.frontData.years[yearId].desktop.splice(yearIndexDesktop, 1);
	draftData[draftId].data.frontData.years[yearId].mobile.splice(yearIndexMobile, 1);

	delete draftData[draftId].data.frontData[artistId];
	delete draftData[draftId].data.artistData[artistId];

	renderFrontData();
	saveData();
}

// Build the main part of the page based on the front page data
function renderFrontData() {

	var maxMobileWidth = 370;
	var draft = draftData[draftId];
	var container = $('#content-container');
	var content = container.children('#content');
	content.html("<h1 id='title'>IHS Artists</h1>");

	// Edit some element styles for different sized containers
	function resizeContent() {
		if (deviceType == 'desktop') {
			content.css('max-width', '970px').css('margin-top', '0px');
			if (container.width() < 1050) {
				$('#title').css('margin-top', '30px');
			}
			if (container.width() < 900) {
				$('#title').css('margin-top', '25px');
			}
		}
		if (deviceType == 'mobile') {
			$('#title').css('margin-left', '4%');
			$('#title').css('margin-top', '20px');

			content.css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');

			if (container.width() < 395) {
				content.css('margin-top', '0px');
			}
		}
	}
	resizeContent();

	// Insert the artist cards into the page
	function loadContent() {

		var frontData = draft.data.frontData;

		// Add in all the year sections
		for (var i = frontData.years.length - 1; i > -1; i--) {

			content.append(`
                <div class="year" id="year-` + i + `">   
                    <input class="year-name" value="${frontData.years[i].name}" />
                    <span class="year-delete material-icons">delete_forever</span>
                    <span class="year-up material-icons">arrow_upward</span>
                    <span class="year-down material-icons">arrow_downward</span>
                    <span class="year-add material-icons">add_circle</span>
                    <br>
                </div>
            `);

			// Add in all the artist cards for this year
			for (var j = 0; j < frontData.years[i][deviceType].length; j++) {

				var artistId = frontData.years[i][deviceType][j];

				if (frontData[artistId].newThumb) {
					if (frontData[artistId].newThumb.hasThumb) {
						let id = frontData[artistId].newThumb.newThumbId;
						var thumb = `<img class="artist-card-thumb ${id}" src=""></img>`;
						if (customImageCache[id]) {
							thumb = `<img class="artist-card-thumb ${id}" src="${customImageCache[id]}"></img>`;
						} else {
							firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
								customImageCache[id] = url;
								$('.' + id).attr('src', url);
							});
						}
					} else {
						var thumb = `<span class='artist-card-placeholder'></span>`;
					}
				} else {
					var thumb = `<img class="artist-card-thumb" src="${websiteBaseUrl}/images/artist-thumb--${artistId}.jpg"></img>`;
				}

				$('#year-' + i).append(`
                    <div id="artist-${artistId}" class="artist-card">
                        ${thumb}
                        <div class="artist-card-bottom">
                            <p class="artist-card-name">${frontData[artistId].name}</p>
                        </div>
                    </div>
                `);
			}

			// Some extra restyling for mobile
			if (deviceType == 'mobile') {
				$('.artist-card').css('width', 'calc(33.1% - 13px)').css('padding-top', '6px');
				$('.artist-card-name').css('font-size', '14px');
				$('.artist-card-bottom').css('height', '43px');
			}
		}
		if (selected !== null) {
			$('#artist-' + selected).addClass('selected');
		}

		// Add in a foooter and update it with the current year
		content.append(`
            <div id='footer'>
                <span id='footer-text'>© Copyright **YEAR**, All Rights Reserved<br><br>Website designed and coded by Josh Chang.</span>
            </div>
        `);
		var today = new Date();
		$('#footer').html($('#footer').html().split('**YEAR**').join(today.getFullYear().toString()));

		if (deviceType == 'mobile') {
			$('#footer').css('margin-left', '15px').css('margin-right', '15px');
		}
	}
	loadContent();
	prepareButtons();
}

// Sends a http request to the GitHub API
function github(type, endpoint, data, success, error) {
	function sendRequest() {
		if (data !== null) {
			$.ajax({
				dataType: 'json',
				url: 'https://api.github.com/' + endpoint,
				type: type,
				data: JSON.stringify(data),
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'token ' + token);
				},
				success: success,
				error: error
			});
		} else {
			$.ajax({
				dataType: 'json',
				url: 'https://api.github.com/' + endpoint,
				type: type,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Authorization', 'token ' + token);
				},
				success: success,
				error: error
			});
		}
	}
	if (token === null) {
		firebase.database().ref('users/' + uid + '/auth').once('value').then(function (snapshot) {
			if (snapshot.val()) {
				token = snapshot.val().token;
				sendRequest();
			}
		});
	} else {
		sendRequest();
	}
}

// Gets a file in the repository
function githubGet(path, success, error) {
	github('GET', 'repos/ihsartists/ihsartists.github.io/contents/' + path + '?_=' + new Date().getTime(), null, data => {
		success(data);
	}, err => {
		error(err);
	});
}

// Updates/creates a file in the repository
function githubPut(path, contents, success, fail) {
	githubGet(path, data => {
		github('PUT', 'repos/ihsartists/ihsartists.github.io/contents/' + path, {
			message: 'Update from console',
			content: contents,
			sha: data.sha
		}, data => {
			success(data);
		}, err => {
			fail(err);
		});
	}, error => {
		github('PUT', 'repos/ihsartists/ihsartists.github.io/contents/' + path, {
			message: 'Update from console',
			content: contents
		}, data => {
			success(data);
		}, err => {
			fail(err);
		});
	});
}

// Deletes a file in the repository
function githubDelete(path, success, fail) {
	githubGet(path, data => {
		github('DELETE', 'repos/ihsartists/ihsartists.github.io/contents/' + path, {
			message: 'Update from console',
			sha: data.sha
		}, data => {
			success(data);
		}, err => {
			fail(err);
		});
	}, error => {
		fail('File does not exist');
	});
}

// Publishes the draft to the live website
function publishDraft() {

	// Confirm that you actually want to publish
	confirmBox('Are you sure you want to publish this draft?', 'This cannot be undone.', 'Publish', 'Cancel', function () {

		// Publish content
		sendDataToGithub();

		closeConfirmBox();

	}, function () {
		closeConfirmBox();
	});
}

// Makes url into data url
const toDataURL = url => fetch(url)
	.then(response => response.blob())
	.then(blob => new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onloadend = () => resolve(reader.result)
		reader.onerror = reject
		reader.readAsDataURL(blob)
	}))

// Unicode base64 function
function base64EncodeUnicode(str) {
	// First we escape the string using encodeURIComponent to get the UTF-8 encoding of the characters, 
	// then we convert the percent encodings into raw bytes, and finally feed it to btoa() function.
	utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
		return String.fromCharCode('0x' + p1);
	});

	return btoa(utf8Bytes);
}

// Sends data to publish to GitHub
function sendDataToGithub() {

	$.ajaxSetup({ cache: false });

	// Aliases and clones
	var draft = draftData[draftId];
	var front = draft.data.frontData;
	var artists = draft.data.artistData;

	var total = 0;
	var done = 0;
	var queue = [];

	// Final data files
	var frontToSave = {
		years: JSON.parse(JSON.stringify(front.years))
	};
	var artistsToSave = {};

	// Iterate over artists
	for (let i = 0; i < front.years.length; i++) {
		for (let j = 0; j < front.years[i].desktop.length; j++) {

			let artist = front.years[i].desktop[j];

			// Save front page data
			if (front[artist].newThumb) {
				frontToSave[artist] = {
					link: front[artist].link,
					name: front[artist].name
				}
				if (front[artist].newThumb.hasThumb) {

					// Request firebase for url of image
					let id = front[artist].newThumb.newThumbId;
					total++;
					firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
						customImageCache[id] = url;

						// Turn the url into a data url
						toDataURL(url).then(dataUrl => {

							// Save result
							queue.push(['images/artist-thumb--' + artist + '.jpg', dataUrl.split(',')[1], false]);
						})
					});

				}
			} else {
				frontToSave[artist] = JSON.parse(JSON.stringify(front[artist]));
			}

			// Save artist data
			artistsToSave[artist] = {
				galleries: artists[artist].galleries,
				images: {},
				link: artists[artist].link,
				name: artists[artist].name,
				statement: artists[artist].statement
			}

			// Iterate over galleries
			for (let k = 0; k < artists[artist].galleries.length; k++) {

				// Iterate over images
				let gallery = artists[artist].galleries[k];
				for (let l = 0; l < gallery.order.length; l++) {

					let image = gallery.order[l]
					artistsToSave[artist].images[image] = {
						name: artists[artist].images[image].name,
						type: artists[artist].images[image].type
					}
					if (artists[artist].images[image].type === 'video') {
						artistsToSave[artist].images[image].embed = artists[artist].images[image].embed;
					}

					// If there is a new thumb
					if (artists[artist].images[image].newThumb) {
						if (artists[artist].images[image].newThumb.hasThumb) {

							// Request firebase for url of image
							let id = artists[artist].images[image].newThumb.newThumbId;
							total++;
							firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
								customImageCache[id] = url;

								// Turn the url into a data url
								toDataURL(url).then(dataUrl => {

									// Save result
									queue.push(['images/image-thumb--' + artist + '-' + image + '.jpg', dataUrl.split(',')[1], false]);
								})
							});

						}
					}

					// If there is a new image
					if (artists[artist].images[image].newImage) {
						if (artists[artist].images[image].newImage.hasImage) {

							// Request firebase for url of image
							let id = artists[artist].images[image].newImage.newImageId;
							total++;
							firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
								customImageCache[id] = url;

								// Turn the url into a data url
								toDataURL(url).then(dataUrl => {

									// Save result
									queue.push(['images/image--' + artist + '-' + image + '.jpg', dataUrl.split(',')[1], false]);
								})
							});

						}
					}
				}
			}
		}
	}

	// Track upload progress
	let spot = 0;
	var queueInterval = setInterval(() => {

		console.log(done + ' of ' + total);

		if (queue[spot]) {
			if (queue[spot][2] === false) {
				queue[spot][2] = true;
				githubPut(queue[spot][0], queue[spot][1], data => {
					done++;
					spot++;
				}, console.error)
			}
		}

		if (done === total) {

			console.log(JSON.stringify(artistsToSave), base64EncodeUnicode(JSON.stringify(artistsToSave)))

			// Upload final data if everything worked
			githubPut('data/front-data.json', base64EncodeUnicode(JSON.stringify(frontToSave)), () => {
				githubPut('data/artist-data.json', base64EncodeUnicode(JSON.stringify(artistsToSave)), data => {

					console.log(data)

					// Close box after done
					bottomAlert('Draft published.', '#26a69a', 3000);

				}, console.error)
			}, console.error);
			clearInterval(queueInterval)
		}
	}, 70)

	console.log(frontToSave);
	console.log(artistsToSave);

}