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
var selected = false;
var firstClick = false;
var fadeTimer;
var containerTimer;

var draftData = [];
var draftId = 0;
var a = 0;
var galleryId = 0;
var imageId = 0;
var aObj;
var aObjFront;
var token = null;

var artworkEditor = {
	open: false,
	type: 'image',
	new: false,
	image: null,
	url: '',
	embed: '',
	newThumb: false,
	thumbImage: null,
	default: false,
	frontNewThumb: false,
	frontThumbImage: null
}

var customImageCache = {};

var websiteBaseUrl = 'https://ihsartists.net/';
var desktopGalleryWidth = 345;
var maxMobileWidth = 370;
var desktopPageHeight = 500;

// Initial loading of the page
function loadPage(userId) {
	uid = userId;

	// Add arrow key events for moving artists
	window.addEventListener("keydown", function (e) {
		if (selected) {
			// Space and arrow keys
			if (['Enter', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].indexOf(e.key) > -1) {
				e.preventDefault();
			}
			handleSelectedKey(e.key);
		}
	}, false);

	// Add handler for clicking off of gallery thumbnail
	$(document).on('click', function () {
		if (firstClick) {
			firstClick = false;
		} else if (selected) {
			$('.selected').removeClass('selected');
			selected = false;
		}
	});

	// Load data from Firebase and render all of it
	loadData(() => {
		aObj = draftData[draftId].data.artistData[a];
		aObjFront = draftData[draftId].data.frontData[a];

		galleryId = aObjFront.link[0];
		imageId = aObjFront.link[1];

		$('title').text(draftData[draftId].name + ' | IHS Artists Console');
		$('#draft-title').val(draftData[draftId].name);

		$('#title').val(aObj.name);
		$('#link-input').val(`https://ihsartists.net/image/?a=${a}&g=${galleryId}&i=${imageId}`);

		prepareInput($("#draft-title"), renameDraft);
		prepareInput($("#title"), renameArtist);
		prepareInput($('#image-description'), renameImage);

		prepareMenus();
		prepareMenuOptions();

		renderArtistData();

		prepareImageUpload($('#artwork-editor-image-upload'), $('#artwork-editor-image-preview'), (file) => {
			artworkEditor.image = file;
		});
		prepareImageUpload($('#artwork-editor-uthumb-upload'), $('#artwork-editor-uthumb-preview'), (file) => {
			artworkEditor.thumbImage = file;
		});
		prepareImageUpload($('#artwork-editor-front-uthumb-upload'), $('#artwork-editor-front-uthumb-preview'), (file) => {
			artworkEditor.frontThumbImage = file;
		});

		prepareInput($('#artwork-editor-video-url'), (url) => {
			if (url.length > 0 && url !== artworkEditor.url) {
				if (isValidUrl(url)) {
					var paramsObj = new URLSearchParams(url.split('?')[1]);
					if (paramsObj.has('v')) {
						artworkEditor.url = url;
						artworkEditor.embed = `https://www.youtube.com/embed/${paramsObj.get('v')}`;
						$('#artwork-editor-video-preview').html(`<iframe src='https://www.youtube.com/embed/${paramsObj.get('v')}'></iframe>`);
					} else {
						$('#artwork-editor-video-url').val(artworkEditor.url);
						bottomAlert('Error: invalid url.', '#ef5350', 3000);
					}
				} else {
					$('#artwork-editor-video-url').val(artworkEditor.url);
					bottomAlert('Error: invalid url.', '#ef5350', 3000);
				}
			} else {
				$('#artwork-editor-video-url').val(artworkEditor.url);
			}
		});
	});
}

// Go to main draft selector menu
function goHome() {
	window.location = '/console/';
}

// Go to the home of the draft
function goBack() {
	window.location = '../?id=' + draftId;
}

//Load the draft data from Firebase
function loadData(callback) {
	firebase.database().ref('users/' + uid + '/drafts').once('value').then(snapshot => {
		if (snapshot.val()) {

			draftData = JSON.parse(snapshot.val());

			//Find the draft ID and artistId from the url parameters (make sure it exists)
			let searchParams = new URLSearchParams(window.location.search);
			if (searchParams.has('id')) {
				draftId = parseInt(searchParams.get('id'));
				if (draftData[draftId]) {
					if (draftData[draftId].name) {
						if (searchParams.has('a')) {
							a = parseInt(searchParams.get('a'));
							if (draftData[draftId].data.artistData[a]) {
								if (draftData[draftId].data.artistData[a].name) {
									callback();
								} else {
									goBack();
								}
							} else {
								goBack();
							}
						} else {
							goBack();
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
		} else {
			goHome();
		}
	});
}

// Save the updated data to Firebase
function saveData() {
	firebase.database().ref('users/' + uid + '/drafts').set(JSON.stringify(draftData)).then(function () {
		console.log('Data saved', aObj);
	});
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

// Initializes the specified input to complete callback on edit
function prepareInput(inputElem, callback) {
	inputElem.focus(
		function () {
			$(this).select();
		}
	).blur(
		function () {
			callback($(this).val());
		}
	).keyup(
		function (e) {
			if (e.key === 'Enter') {
				$(this).trigger('blur');
			}
		}
	);
}

// Checks new names for errors and then updates data
function renameDraft(text) {
	if (draftData[draftId].name !== text.trim()) {
		if (text.trim() !== '') {
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
function renameArtist(text) {
	if (aObj.name !== text.trim()) {
		if (text.trim() !== '') {
			if (text.trim().length < 34) {
				aObj.name = text.trim();
				aObjFront.name = aObj.name;
				bottomAlert('Renamed.', '#757575', 3000);
			} else {
				bottomAlert('Error: too long.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: please enter a name.', '#ef5350', 3000);
		}
	}
	$('#title').val(aObj.name);

	saveData();
}

// Runs a preview of the draft in a new window
function previewDraft() {
	window.open('../preview/image/?id=' + draftId + '&a=' + a + '&g=' + galleryId + '&i=' + imageId + '&t=' + $('#title').val(), '_blank');
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
	new: goHome,
	open: goHome,
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
	preview: previewDraft,
	publish: publishDraft,
	back: goBack,
	signout: function () {
		firebase.auth().signOut();
	},

	up: function () {
		if (selected) {
			handleSelectedKey('ArrowUp');
		} else {
			bottomAlert('Error: no artwork selected.', '#ef5350', 2400);
		}
	},
	down: function () {
		if (selected) {
			handleSelectedKey('ArrowDown');
		} else {
			bottomAlert('Error: no artwork selected.', '#ef5350', 2400);
		}
	},
	left: function () {
		if (selected) {
			handleSelectedKey('ArrowLeft');
		} else {
			bottomAlert('Error: no artwork selected.', '#ef5350', 2400);
		}
	},
	right: function () {
		if (selected) {
			handleSelectedKey('ArrowRight');
		} else {
			bottomAlert('Error: no artwork selected.', '#ef5350', 2400);
		}
	},
	deleteArtwork: function () {
		handleSelectedKey('Backspace');
	},
	copyLink: function () {
		var copyText = document.querySelector("#link-input");
		copyText.select();
		document.execCommand("copy");
		bottomAlert('Link copied.', '#2196f3', 2000);
	},
	renameGallery: function () {
		$('#gallery-navigator-tab--current input').focus();
		hideMenuSection($('#menu-section-edit'));
	},
	deleteGallery: function () {
		if (aObj.galleries.length > 1) {
			if (aObj.link[0] !== galleryId) {
				confirmBox('Are you sure you want to delete this gallery?', 'This cannot be undone.', 'Delete', 'Cancel', function () {
					var removed = aObj.galleries.splice(galleryId, 1);

					galleryId = 0;
					imageId = aObj.galleries[0].order[0];

					renderArtistData();
					bottomAlert('Gallery deleted.', '#ec407a', 3000);
					saveData();
					closeConfirmBox();

				}, function () {
					closeConfirmBox();
				});
			} else {
				bottomAlert('Error: cannot delete the default gallery.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: cannot delete the only gallery.', '#ef5350', 3000);
		}
	},
	renameArtist: function () {
		$('#title').focus();
		hideMenuSection($('#menu-section-edit'));
	},

	fullscreen: function () {
		var fullscreen = $('#menu-option-fullscreen');
		if (fullscreen.text() === 'Fullscreen') {
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

	image: newArtwork,
	gallery: newGallery
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

// Handles the key movements that move the selected thing
function handleSelectedKey(key) {

	var collumns = 4;
	var galleryIndex = aObj.galleries[galleryId].order.indexOf(imageId);

	// Move left
	if (key === 'ArrowLeft') {
		if (galleryIndex % collumns > 0 && aObj.galleries[galleryId].order[galleryIndex - 1] !== undefined) {

			var imageLeft = aObj.galleries[galleryId].order[galleryIndex - 1];
			aObj.galleries[galleryId].order[galleryIndex - 1] = aObj.galleries[galleryId].order[galleryIndex];
			aObj.galleries[galleryId].order[galleryIndex] = imageLeft;

			renderGallery();
			saveData();

		} else if (galleryId > 0 && aObj.galleries[galleryId].order.length > 1) {

			aObj.galleries[galleryId].order.splice(galleryIndex, 1);
			aObj.galleries[galleryId - 1].order.push(imageId);
			galleryId--;

			if (imageId === aObj.link[1]) {
				aObj.link[0]--;
				aObjFront.link[0]--;
			}

			renderGallery();
			renderGalleryNavigator();
			saveData();

			bottomAlert('Moved to gallery: ' + aObj.galleries[galleryId].name, '#ff7043', 3100);
		}
	}
	// Move up
	if (key === 'ArrowUp') {
		if (aObj.galleries[galleryId].order[galleryIndex - collumns] !== undefined) {

			var imageUp = aObj.galleries[galleryId].order[galleryIndex - collumns];
			aObj.galleries[galleryId].order[galleryIndex - collumns] = aObj.galleries[galleryId].order[galleryIndex];
			aObj.galleries[galleryId].order[galleryIndex] = imageUp;

			renderGallery();
			saveData();
		}
	}
	// Move right
	if (key === 'ArrowRight') {
		if (galleryIndex % collumns < collumns - 1 && aObj.galleries[galleryId].order[galleryIndex + 1] !== undefined) {

			var imageRight = aObj.galleries[galleryId].order[galleryIndex + 1];
			aObj.galleries[galleryId].order[galleryIndex + 1] = aObj.galleries[galleryId].order[galleryIndex];
			aObj.galleries[galleryId].order[galleryIndex] = imageRight;

			renderGallery();
			saveData();

		} else if (galleryId < aObj.galleries.length - 1 && aObj.galleries[galleryId].order.length > 1) {

			aObj.galleries[galleryId].order.splice(galleryIndex, 1);
			aObj.galleries[galleryId + 1].order.push(imageId);
			galleryId++;

			if (imageId === aObj.link[1]) {
				aObj.link[0]++;
				aObjFront.link[0]++;
			}

			renderGallery();
			renderGalleryNavigator();
			saveData();

			bottomAlert('Moved to gallery: ' + aObj.galleries[galleryId].name, '#ff7043', 3100);
		}
	}
	// Move down
	if (key === 'ArrowDown') {
		if (aObj.galleries[galleryId].order[galleryIndex + collumns] !== undefined) {

			var imageDown = aObj.galleries[galleryId].order[galleryIndex + collumns];
			aObj.galleries[galleryId].order[galleryIndex + collumns] = aObj.galleries[galleryId].order[galleryIndex];
			aObj.galleries[galleryId].order[galleryIndex] = imageDown;

			renderGallery();
			saveData();
		}
	}

	// Delete
	if (key === 'Backspace' || key === 'Delete') {
		if (aObj.galleries[galleryId].order.length > 1) {
			if (aObj.link[1] !== imageId) {
				confirmBox('Are you sure you want to delete this artwork?', 'This cannot be undone.', 'Delete', 'Cancel', function () {
					aObj.galleries[galleryId].order.splice(galleryIndex, 1);

					if (aObj.galleries[galleryId].order[galleryIndex] !== undefined) {
						imageId = aObj.galleries[galleryId].order[galleryIndex];
					} else {
						imageId = aObj.galleries[galleryId].order[galleryIndex - 1];
					}

					renderArtistData();
					bottomAlert('Artwork deleted.', '#ec407a', 3000);
					saveData();
					closeConfirmBox();

				}, function () {
					closeConfirmBox();
				});
			} else {
				bottomAlert('Error: cannot delete the default artwork.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: cannot delete the only artwork in a gallery.', '#ef5350', 3000);
		}
	}
	// Edit
	if (key === 'Enter') {
		openArtworkEditor();
	}
}

// Resize main image on load
function resizeImage() {

	// Reset image
	$('#main-image').css({
		'width': 'auto',
		'max-width': 'auto',
		'height': 'auto',
		'max-height': 'auto'
	});
	$('#main-image-container').css('margin-top', '50px');
	$('#main-image-scroll-container').css({
		'overflow-x': 'none',
		'overflow-y': 'none',
		'height': 'auto',
		'max-height': 'auto'
	});
	$('#main-image-padding-container').css({
		'width': 'auto',
		'max-width': 'auto'
	});

	// Get dimensions
	var naturalWidth = $('#main-image')[0].naturalWidth;
	var naturalHeight = $('#main-image')[0].naturalHeight;
	var containerWidth = $('#main-image-container').width();

	// Decide the type of scale that needs to be applied
	var scaleType = 'dynamic';
	if (naturalWidth > 594 && naturalWidth < 608) {
		scaleType = 'width';
		if (naturalHeight > 457) {
			scaleType = 'vertical-scroll';
		}
	}
	else if (naturalHeight > 442 && naturalHeight < 458) {
		scaleType = 'height';
		if (naturalWidth > 607) {
			scaleType = 'horizontal-scroll';
		}
	}

	if (scaleType == 'dynamic') {
		if (naturalHeight > 0.75 * naturalWidth) {
			naturalWidth = (naturalWidth / naturalHeight) * 450;
			naturalHeight = 450;
			scaleType = 'height';
		} else {
			naturalHeight = (naturalHeight / naturalWidth) * 600;
			naturalWidth = 600;
			scaleType = 'width';
		}
	}
	containerWidth -= desktopGalleryWidth;

	// Apply the scale calculations
	if (scaleType == 'width') {
		$('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
	}
	if (scaleType == 'height') {
		$('#main-image').css('height', containerWidth * (naturalHeight / naturalWidth) + 'px').css('max-height', '450px');
	}
	if (scaleType == 'vertical-scroll') {
		$('#main-image-scroll-container').css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
		$('#main-image').css('width', containerWidth + 'px').css('max-width', '600px').height(naturalHeight * ($('#main-image').width() / naturalWidth));
	}
	if (scaleType == 'horizontal-scroll') {
		$('#main-image-scroll-container').css('overflow-x', 'scroll');
		$('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px');
		$('#main-image').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px').width(naturalWidth * ($('#main-image').height() / naturalHeight));
	}

	if ($('#main-image').height() < containerWidth * 0.75) {
		$('#main-image-container').css('margin-top', (containerWidth * 0.75 - $('#main-image').height()) + 'px');
		if (parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)) {
			$('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
		}
	}
	if ($('#main-image-container').height() < desktopPageHeight) {
		$('#main-image-container').css('margin-top', (desktopPageHeight - $('#main-image-padding-container').height()) + 'px');
		if (parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)) {
			$('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
		}
	}
}

// Render a different image
function changeImage(gallery, image, click) {
	galleryId = gallery;
	imageId = image;
	renderArtistData();

	$('#link-input').val(`https://ihsartists.net/image/?a=${a}&g=${galleryId}&i=${imageId}`);

	if (click) {
		firstClick = true;
		selected = true;
		$('.selected').removeClass('selected');
		$('#gallery-image--current').addClass('selected');
	}
}

// Handle the renaming of a gallery
function renameGallery(text) {
	if (aObj.galleries[galleryId].name !== text.trim()) {
		if (text.trim() !== '') {
			if (text.trim().length < 18) {
				aObj.galleries[galleryId].name = text.trim();
				bottomAlert('Renamed.', '#757575', 3000);
			} else {
				bottomAlert('Error: too long.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: please enter a name.', '#ef5350', 3000);
		}
	}
	$('#gallery-navigator-tab--current input').val(aObj.galleries[galleryId].name);

	saveData();
}

// Handle the renaming of an image
function renameImage(text) {
	if (aObj.images[imageId].name !== text.trim()) {
		if (text.trim() !== '') {
			if (text.trim().length < 180) {
				aObj.images[imageId].name = text.trim();
				bottomAlert('Renamed.', '#757575', 3000);
			} else {
				bottomAlert('Error: too long.', '#ef5350', 3000);
			}
		} else {
			bottomAlert('Error: please enter a name.', '#ef5350', 3000);
		}
	}
	$('#image-description').val(aObj.images[imageId].name);

	saveData();
}

// Upload an image to firebase
function uploadImage(imgFile, callback) {
	var storageRef = firebase.storage().ref();

	var getRandomId = function () {
		return '_' + Math.random().toString(36).substr(2, 9);
	};
	let id = getRandomId();
	storageRef.child('user/' + uid + '/' + id + '.jpg').put(imgFile, {
		contentType: 'image/jpeg',
	}).then(function () {
		callback(id);
		renderGallery();
		renderMainImage();
		saveData();
		draftData[draftId].newImages.push(id);
	});
}

// Crop an image to an aspect ratio
function cropImage(url, aspectRatio, dimensions) {

	// we return a Promise that gets resolved with our canvas element
	return new Promise(resolve => {

		// this image will hold our source image data
		const inputImage = new Image();

		// we want to wait for our image to load
		inputImage.onload = () => {

			// let's store the width and height of our image
			const inputWidth = inputImage.naturalWidth;
			const inputHeight = inputImage.naturalHeight;

			// get the aspect ratio of the input image
			const inputImageAspectRatio = inputWidth / inputHeight;

			// if it's bigger than our target aspect ratio
			let outputWidth = inputWidth;
			let outputHeight = inputHeight;
			if (inputImageAspectRatio > aspectRatio) {
				outputWidth = inputHeight * aspectRatio;
			} else if (inputImageAspectRatio < aspectRatio) {
				outputHeight = inputWidth / aspectRatio;
			}

			// calculate the position to draw the image at
			const outputX = (outputWidth - inputWidth) * .5;
			const outputY = (outputHeight - inputHeight) * .5;

			// create a canvas that will present the output image
			const outputImage = document.createElement('canvas');

			// store the scale factor
			const scale = dimensions / outputWidth;

			// set it to the same size as the image
			outputImage.width = outputWidth * scale;
			outputImage.height = outputHeight * scale;

			// draw our image at position 0, 0 on the canvas
			const ctx = outputImage.getContext('2d');
			ctx.drawImage(inputImage, outputX * scale, outputY * scale, inputWidth * scale, inputHeight * scale);
			resolve(outputImage);
		};

		// start loading our image
		inputImage.src = url;
	})

}

// Displays the UI for editing the artist statement
function openStatementEditor() {
	$('#page-container').css('filter', 'blur(3px)');
	$('#statement-editor-container').css('display', 'block');
	$('#background-blur').css('display', 'block');
	$('#top-bar-container').css('top', '-90px');
}

// Closes the statement editor UI
function statementEditorCancel() {
	$('#page-container').css('filter', 'none');
	$('#statement-editor-container').css('display', 'none');
	$('#background-blur').css('display', 'none');
	$('#top-bar-container').css('top', '0px');
}

// Closes the statement editor and saves the content
function statementEditorSave() {
	statementEditorCancel();
	aObj.statement.content = $('#statement-editor-textarea').val();
	saveData();
	bottomAlert('Statement saved.', '#2196f3', 3000);
}

// Displays the form for editing the current artwork
function openArtworkEditor() {
	artworkEditor.open = true;
	$('#page-container').css('filter', 'blur(3px)');
	$('#artwork-editor-container').css('display', 'block');
	$('#background-blur').css('display', 'block');
	$('#top-bar-container').css('top', '-90px');
}

// Closes the artwork editor UI
function artworkEditorCancel() {
	artworkEditor.open = false;
	$('#page-container').css('filter', 'none');
	$('#artwork-editor-container').css('display', 'none');
	$('#background-blur').css('display', 'none');
	$('#top-bar-container').css('top', '0px');
}

// Closes the artwork editor and saves the content
function artworkEditorSave() {

	var error = '';

	// Error tree
	if (artworkEditor.new) {
		if (artworkEditor.type === 'image') {
			if (artworkEditor.image) {
				if (artworkEditor.image.type !== 'image/jpeg') {
					error = 'artwork image - only JPEG files are permitted';
				}
			} else {
				error = 'no artwork image uploaded';
			}
		} else {
			if (!artworkEditor.embed) {
				error = 'no valid video link provided';
			}
		}
	}
	if (artworkEditor.newThumb) {
		if (artworkEditor.thumbImage) {
			if (artworkEditor.thumbImage.type !== 'image/jpeg') {
				error = 'artwork thumbnail - only JPEG files are permitted';
			}
		} else {
			error = 'no artwork thumbnail uploaded';
		}
	}
	if (artworkEditor.default) {
		if (artworkEditor.frontNewThumb) {
			if (artworkEditor.frontThumbImage) {
				if (artworkEditor.frontThumbImage.type !== 'image/jpeg') {
					error = 'artist thumbnail - only JPEG files are permitted';
				}
			} else {
				error = 'no artist thumbnail uploaded';
			}
		}
	}

	// Handle error or save data
	if (error !== '') {
		bottomAlert('Error: ' + error + '.', '#ef5350', 3000);
	} else {
		artworkEditorCancel();

		// Save new artwork
		if (artworkEditor.new) {
			if (artworkEditor.type === 'image') {
				uploadImage(artworkEditor.image, id => {
					aObj.images[imageId].type = 'image';
					if (aObj.images[imageId].embed) {
						delete aObj.images[imageId].embed;
					}
					aObj.images[imageId].newImage = {
						hasImage: true,
						newImageId: id
					};
				});
			} else {
				aObj.images[imageId].type = 'video';
				if (aObj.images[imageId].newImage) {
					delete aObj.images[imageId].newImage;
				}
				aObj.images[imageId].embed = artworkEditor.embed;
			}
		}

		// Save new artwork thumb
		if (artworkEditor.newThumb) {
			uploadImage(artworkEditor.thumbImage, id => {
				aObj.images[imageId].newThumb = {
					hasThumb: true,
					newThumbId: id
				};
			});
		} else if (artworkEditor.new && artworkEditor.type === 'image') {
			cropImage(URL.createObjectURL(artworkEditor.image), 1, 100).then(outputImage => {
				outputImage.toBlob(blob => {
					uploadImage(blob, id => {
						aObj.images[imageId].newThumb = {
							hasThumb: true,
							newThumbId: id
						};
					});
				}, 'image/jpeg');
			});
		}

		// Save new artist thumb
		if (artworkEditor.default) {
			if (artworkEditor.frontNewThumb) {
				uploadImage(artworkEditor.frontThumbImage, id => {
					aObjFront.newThumb = {
						hasThumb: true,
						newThumbId: id
					};
				});
			} else if (artworkEditor.new) {
				cropImage(URL.createObjectURL(artworkEditor.image), 1, 240).then(outputImage => {
					outputImage.toBlob(blob => {
						uploadImage(blob, id => {
							aObjFront.newThumb = {
								hasThumb: true,
								newThumbId: id
							};
						});
					}, 'image/jpeg');
				});
			} else if (aObj.link[1] !== imageId) {

				let srcUrl = $('#main-image').attr('src');
				console.log(srcUrl);
				$.ajax({
					url: srcUrl,
					type: "GET",
					mimeType: "text/plain; charset=x-user-defined"
				}).done(function (data, textStatus, jqXHR) {
					let dataUriStart = 'data:image/jpeg;base64,';
					console.log(dataUriStart + base64encode(data));
					cropImage(dataUriStart + base64encode(data), 1, 240).then(outputImage => {
						outputImage.toBlob(blob => {
							uploadImage(blob, id => {
								aObjFront.newThumb = {
									hasThumb: true,
									newThumbId: id
								};
							});
						}, 'image/jpeg');
					});
				}).fail(function (jqXHR, textStatus, errorThrown) {
					alert("fail: " + errorThrown);
				});
			}
			aObj.link = [galleryId, imageId];
			aObjFront.link = [galleryId, imageId];
		}

		renderArtistData();
		saveData();
		bottomAlert('Artwork saved.', '#2196f3', 3000);
	}
}

// Set the current artwork type to an image
function setTypeImage() {
	artworkEditor.type = 'image';
	$('#artwork-editor-type-video').removeClass('artwork-editor-selected');
	$('#artwork-editor-type-image').addClass('artwork-editor-selected');

	if (artworkEditor.new) {
		$('#artwork-editor-video').css('display', 'none');
		$('#artwork-editor-image').css('display', 'block');
	}
}

// Set the current artwork type to a video
function setTypeVideo() {
	artworkEditor.type = 'video';
	$('#artwork-editor-type-image').removeClass('artwork-editor-selected');
	$('#artwork-editor-type-video').addClass('artwork-editor-selected');

	$('#artwork-editor-video-url').val(artworkEditor.url);
	$('#artwork-editor-image').css('display', 'none');
	$('#artwork-editor-video').css('display', 'block');

	setNewThumbTrue();
	setFrontNewThumbTrue();
}

// Select keep current artwork
function setNewFalse() {
	if (aObj.images[imageId].type === 'image' && aObj.images[imageId].newImage) {
		if (!aObj.images[imageId].newImage.hasImage) {
			if (artworkEditor.open === true) {
				bottomAlert('Error: there is no current artwork.', '#ef5350', 3000);
			}
			return;
		}
	}
	artworkEditor.new = false;

	$('#artwork-editor-new-true').removeClass('artwork-editor-selected');
	$('#artwork-editor-new-false').addClass('artwork-editor-selected');

	$('#artwork-editor-video').css('display', 'none');
	$('#artwork-editor-image').css('display', 'none');
	$('#artwork-editor-type').css('display', 'none');

	$('#artwork-editor-cthumb-false').text('Keep Current');
	$('#artwork-editor-front-cthumb-false').text('Keep Current');
}

// Select choose new artwork
function setNewTrue() {
	artworkEditor.new = true;

	$('#artwork-editor-new-false').removeClass('artwork-editor-selected');
	$('#artwork-editor-new-true').addClass('artwork-editor-selected');

	$('#artwork-editor-type').css('display', 'block');

	if (artworkEditor.type === 'image') {
		$('#artwork-editor-video').css('display', 'none');
		$('#artwork-editor-image').css('display', 'block');
	} else {
		$('#artwork-editor-image').removeClass('artwork-editor-selected');
		$('#artwork-editor-type-video').addClass('artwork-editor-selected');
		$('#artwork-editor-image').css('display', 'none');
		$('#artwork-editor-video').css('display', 'block');

		setNewThumbTrue();
	}

	$('#artwork-editor-cthumb-false').text('Automatic');
	$('#artwork-editor-front-cthumb-false').text('Automatic');
}

// Select keep current thumbnail
function setNewThumbFalse() {
	if (artworkEditor.new === true && artworkEditor.type === 'video') {
		bottomAlert('Error: thumbnails cannot be auto-generated for videos.', '#ef5350', 3000);
	} else {
		artworkEditor.newThumb = false;

		$('#artwork-editor-cthumb-true').removeClass('artwork-editor-selected');
		$('#artwork-editor-cthumb-false').addClass('artwork-editor-selected');

		$('#artwork-editor-uthumb').css('display', 'none');
	}
}

// Select choose new thumbnail
function setNewThumbTrue() {
	artworkEditor.newThumb = true;

	$('#artwork-editor-cthumb-false').removeClass('artwork-editor-selected');
	$('#artwork-editor-cthumb-true').addClass('artwork-editor-selected');

	$('#artwork-editor-uthumb').css('display', 'block');
}

// Keep the current default artwork
function setDefaultFalse() {
	if (aObj.link[1] === imageId) {
		bottomAlert('Error: this artwork is already the default.', '#ef5350', 3000);
	} else {
		artworkEditor.default = false;

		$('#artwork-editor-front-true').removeClass('artwork-editor-selected');
		$('#artwork-editor-front-false').addClass('artwork-editor-selected');

		$('#artwork-editor-front-cthumb').css('display', 'none');
		$('#artwork-editor-front-uthumb').css('display', 'none');
	}
}

// Make the current artwork the default
function setDefaultTrue() {
	artworkEditor.default = true;

	$('#artwork-editor-front-false').removeClass('artwork-editor-selected');
	$('#artwork-editor-front-true').addClass('artwork-editor-selected');

	$('#artwork-editor-front-cthumb').css('display', 'block');

	if (artworkEditor.frontNewThumb === true) {
		$('#artwork-editor-front-uthumb').css('display', 'block');
	} else {
		$('#artwork-editor-front-uthumb').css('display', 'none');
	}

	if (aObj.link[1] === imageId) {
		$('#artwork-editor-front-cthumb-false').text('Keep Current');
	} else {
		$('#artwork-editor-front-cthumb-false').text('Automatic');
		if (artworkEditor.type === 'video') {
			setFrontNewThumbTrue();
		}
	}
}

// Select keep current front thumbnail
function setFrontNewThumbFalse() {
	if (artworkEditor.default === true && ((aObj.images[imageId].type === 'video' && artworkEditor.new === false) || (artworkEditor.type === 'video' && artworkEditor.new === true))) {
		bottomAlert('Error: thumbnails cannot be auto-generated for videos.', '#ef5350', 3000);
	} else {
		artworkEditor.frontNewThumb = false;

		$('#artwork-editor-front-cthumb-true').removeClass('artwork-editor-selected');
		$('#artwork-editor-front-cthumb-false').addClass('artwork-editor-selected');

		$('#artwork-editor-front-uthumb').css('display', 'none');
	}
}

// Select choose new front thumbnail
function setFrontNewThumbTrue() {
	artworkEditor.frontNewThumb = true;

	$('#artwork-editor-front-cthumb-false').removeClass('artwork-editor-selected');
	$('#artwork-editor-front-cthumb-true').addClass('artwork-editor-selected');

	if (artworkEditor.default === true) {
		$('#artwork-editor-front-uthumb').css('display', 'block');
	}
}

// Determines if the input is a valid URL
function isValidUrl(string) {
	try {
		new URL(string);
	} catch (_) {
		return false;
	}
	return true;
}

// Prepare an image upload 
function prepareImageUpload(input, preview, callback) {
	input.on('change', function () {
		preview.attr('src', URL.createObjectURL(input[0].files[0]));
		callback(input[0].files[0]);
	});
}

// Inserts a new image into the current gallery
function newArtwork() {

	var newArtworkId = 0;
	for(let i = 0; i < Object.keys(aObj.images).length; i++){
		if(parseInt(Object.keys(aObj.images)[i]) >= newArtworkId){
			newArtworkId = parseInt(Object.keys(aObj.images)[i]) + 1;
		}
	}

	aObj.galleries[galleryId].order.push(newArtworkId);
	aObj.images[newArtworkId] = {
		name: "Artwork description",
		type: "image",
		newImage: {
			hasImage: false
		},
		newThumb: {
			hasThumb: false
		}
	};

	imageId = newArtworkId;
	selected = true;

	renderMainImage();
	renderGallery();
	prepareArtworkEditor();

	saveData();

	bottomAlert('Artwork created.', '#26a69a', 3000);
}

// Create and initialize a new gallery
function newGallery() {
	var newArtworkId = 0;
	for(let i = 0; i < Object.keys(aObj.images).length; i++){
		if(parseInt(Object.keys(aObj.images)[i]) >= newArtworkId){
			newArtworkId = parseInt(Object.keys(aObj.images)[i]) + 1;
		}
	}

	aObj.galleries.push({
		name: (aObj.galleries.length + 1).toString(),
		order: [newArtworkId]
	});
	aObj.images[newArtworkId] = {
		name: "Artwork description",
		type: "image",
		newImage: {
			hasImage: false
		},
		newThumb: {
			hasThumb: false
		}
	};
	galleryId = aObj.galleries.length - 1;
	imageId = newArtworkId;
	saveData();
	renderArtistData();

	bottomAlert('Gallery created.', '#26a69a', 3000);
}

// Shift the selected gallery one to the left
function moveGalleryTabLeft() {
	if (galleryId > 0) {
		var currentGallery = JSON.parse(JSON.stringify(aObj.galleries[galleryId]));
		var leftGallery = JSON.parse(JSON.stringify(aObj.galleries[galleryId - 1]));

		aObj.galleries[galleryId] = leftGallery;
		aObj.galleries[galleryId - 1] = currentGallery;

		if (aObj.link[0] === galleryId) {
			aObj.link[0]--;
			aObjFront.link[0]--;
		} else if (aObj.link[0] === galleryId - 1) {
			aObj.link[0]++;
			aObjFront.link[0]++;
		}

		galleryId--;

		renderGalleryNavigator();
		saveData();
	}
}

// Shift the selected gallery one to the right
function moveGalleryTabRight() {
	if (galleryId < aObj.galleries.length - 1) {
		var currentGallery = JSON.parse(JSON.stringify(aObj.galleries[galleryId]));
		var rightGallery = JSON.parse(JSON.stringify(aObj.galleries[galleryId + 1]));

		aObj.galleries[galleryId] = rightGallery;
		aObj.galleries[galleryId + 1] = currentGallery;

		if (aObj.link[0] === galleryId) {
			aObj.link[0]++;
			aObjFront.link[0]++;
		} else if (aObj.link[0] === galleryId + 1) {
			aObj.link[0]--;
			aObjFront.link[0]--;
		}

		galleryId++;

		renderGalleryNavigator();
		saveData();
	}
}

// Base64 encodes input
function base64encode(str) {
	var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var out = "", i = 0, len = str.length, c1, c2, c3;
	while (i < len) {
		c1 = str.charCodeAt(i++) & 0xff;
		if (i == len) {
			out += CHARS.charAt(c1 >> 2);
			out += CHARS.charAt((c1 & 0x3) << 4);
			out += "==";
			break;
		}
		c2 = str.charCodeAt(i++);
		if (i == len) {
			out += CHARS.charAt(c1 >> 2);
			out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
			out += CHARS.charAt((c2 & 0xF) << 2);
			out += "=";
			break;
		}
		c3 = str.charCodeAt(i++);
		out += CHARS.charAt(c1 >> 2);
		out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
		out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
		out += CHARS.charAt(c3 & 0x3F);
	}
	return out;
}

// Build the main part of the page based on the artist data
function renderArtistData() {

	var container = $('#content-container');

	// Edit some element styles for different sized containers
	function resizeContent() {
		if (container.width() < 1050) {
			$('#title').css('margin-top', '25px');
		}
		if (container.width() < 900) {
			$('#title').css('margin-top', '20px');
		}
	}
	resizeContent();

	// Render artist data onto DOM
	function loadContent() {

		$('#statement-editor-textarea').val(aObj.statement.content);

		renderMainImage();
		renderGallery();
		renderGalleryNavigator();
		prepareArtworkEditor();
	}
	loadContent();
}

// Render the main image of the page
function renderMainImage() {

	$('#image-description').val(aObj.images[imageId].name);

	// Image
	if (aObj.images[imageId].type === 'image') {
		if ($('#main-image').length) {
			var height = $('#main-image').height();
		}
		$('#main-image-padding-container').html(`
			<div id='main-image-scroll-container'>
				<img id='main-image'>
			</div>
		`);
		$('#main-image').height(height);

		// Uploaded image that is from Firebase
		if (aObj.images[imageId].newImage) {

			// Has new image - load from Firebase
			if (aObj.images[imageId].newImage.hasImage) {
				let id = aObj.images[imageId].newImage.newImageId;
				if (customImageCache[id]) {
					$('#main-image').removeClass('main-image-placeholder').on('load', resizeImage).attr('src', customImageCache[id]);
				} else {
					firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
						customImageCache[id] = url;
						$('#main-image').removeClass('main-image-placeholder').on('load', resizeImage).attr('src', url);
					});
				}
			}
			// Placeholder 
			else {
				$('#main-image-container')[0].outerHTML = `
					<div id='main-image-container'>
						<div id='main-image-padding-container'>
							<div id='main-image-scroll-container'>
								<img id='main-image' class='main-image-placeholder'>
							</div>
						</div>
					</div>
				`;
				setNewTrue();
			}
		}
		// Image that is from ihsartists.net
		else {
			$('#main-image').removeClass('main-image-placeholder').on('load', resizeImage).attr('src', `${websiteBaseUrl}/images/image--${a}-${imageId}.jpg`);
		}
		setTypeImage();
	}
	// Video
	else {
		$('#main-image-padding-container').html('<iframe class="main-video" width="100%" height="100%" src="' + aObj.images[imageId].embed + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');

		// Resize video
		let containerWidth = $('#main-image-container').width() - desktopGalleryWidth;
		$('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px').height(containerWidth * 0.5625).css('max-height', '337.5px');
		if ($('#main-image-container').height() < desktopPageHeight) {
			$('#main-image-container').css('margin-top', (desktopPageHeight - $('#main-image-padding-container').height()) + 'px');

			if (parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)) {
				$('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
			}
		}

		setTypeVideo();
	}
}

// Render the main image of the page
function renderGallery() {

	$('#gallery-container').css('height', $('#gallery-container').width() * 0.75 + 'px');
	$('.gallery-image').css('height', ($('#gallery-container').width() / 4 - 4) + 'px');
	$('#gallery-container').html('');

	for (var i = 0; i < aObj.galleries[galleryId].order.length; i++) {

		// See if it is the current image and label accordingly
		var currentLabel = '';
		if (aObj.galleries[galleryId].order[i] === imageId) {
			currentLabel = `id='gallery-image--current'`;
		}

		// See if it is the selected image and label accordingly
		var selectedLabel = '';
		if (aObj.galleries[galleryId].order[i] === imageId && selected) {
			selectedLabel = ` selected`;
		}

		// Determine if it is new image from firebase or should be loaded from website
		if (aObj.images[aObj.galleries[galleryId].order[i]].newThumb) {
			if (aObj.images[aObj.galleries[galleryId].order[i]].newThumb.hasThumb) {
				let id = aObj.images[aObj.galleries[galleryId].order[i]].newThumb.newThumbId;
				$('#gallery-container').append(`
					<span onclick='changeImage(${galleryId},${aObj.galleries[galleryId].order[i]},1)'>
						<img ${currentLabel} class='gallery-image${selectedLabel} ${id}' src=''>
					</span>
				`);
				if (customImageCache[id]) {
					$('.' + id).attr('src', customImageCache[id]);
				} else {
					firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
						customImageCache[id] = url;
						$('.' + id).attr('src', url);
					});
				}
			} else {
				$('#gallery-container').append(`
					<span onclick='changeImage(${galleryId},${aObj.galleries[galleryId].order[i]},1)'>
						<img ${currentLabel} class='gallery-image gallery-image-placeholder${selectedLabel}'>
					</span>
				`);
			}
		} else {
			$('#gallery-container').append(`
				<span onclick='changeImage(${galleryId},${aObj.galleries[galleryId].order[i]},1)'>
					<img ${currentLabel} class='gallery-image${selectedLabel}' src='${websiteBaseUrl}images/image-thumb--${a}-${aObj.galleries[galleryId].order[i]}.jpg'>
				</span>
			`);
		}
	}
	if (aObj.galleries[galleryId].order.length < 12) {
		$('#gallery-container').append(`
			<span class='new-artwork-button' onclick='newArtwork();'><span class='plus'>+</span></span>
		`);
	}
}

// Render the galelry navigator at the top
function renderGalleryNavigator() {

	$('#gallery-navigator-text').html('Gallery:');
	for (var i = 0; i < aObj.galleries.length; i++) {
		if (i === galleryId) {
			$('#gallery-navigator-text').append(`<span class='gallery-navigator-tab' id='gallery-navigator-tab--current'><span onclick='moveGalleryTabLeft();' id='gallery-navigator-move--left' class='gallery-navigator-move material-icons'>arrow_back</span><input class='gallery-navigator-tab' value='${aObj.galleries[i].name}'><span onclick='moveGalleryTabRight();' id='gallery-navigator-move--right' class='gallery-navigator-move material-icons'>arrow_forward</span></span>`);
		} else {
			$('#gallery-navigator-text').append(`<a class='gallery-navigator-tab' onclick='changeImage(${i},${aObj.galleries[i].order[0]})'>${aObj.galleries[i].name}</a>`);
		}
	}

	$('#gallery-navigator-text').append(`<a class='gallery-navigator-tab' onclick='newGallery();'>+</a>`);
	prepareInput($('#gallery-navigator-tab--current input'), renameGallery);
}

// Reset the artwork editor
function prepareArtworkEditor() {
	setNewFalse();
	setNewThumbFalse();
	if (imageId === aObj.link[1]) {
		setDefaultTrue();
	} else {
		setDefaultFalse();
	}
	setFrontNewThumbFalse();
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

		$('title').text(done + ' of ' + total);

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

			// Upload final data if everything worked
			githubPut('data/front-data.json', base64EncodeUnicode(JSON.stringify(frontToSave)), () => {
				githubPut('data/artist-data.json', base64EncodeUnicode(JSON.stringify(artistsToSave)), data => {

					// Reset/save data
					draftData[draftId].data.artistData = artistsToSave;
					draftData[draftId].data.frontData = frontToSave;
					saveData();

					$('title').text(draftData[draftId].name + ' | IHS Artists Console');

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
