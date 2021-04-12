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
                        firebase.database().ref('users/' + authResult.user.uid + '/token').set(authResult.credential.accessToken);
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
var draftData = [];
var draftId = 0;
var customImageCache = {};
var websiteBaseUrl = 'https://ihsartists.net/';

var deviceType = 'desktop';
var desktopGalleryWidth = 345;
var maxMobileWidth = 370;
var desktopPageHeight = 500;
var statementPadding = 120;
var statementMobilePadding = 60;

// Initialize url parameters
$.urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    return decodeURI(results[1]) || 0;
}

var artist = $.urlParam('a');
var artistName = $.urlParam('t');
var gallery = $.urlParam('g');
var image = $.urlParam('i');
var statement = $.urlParam('s');

if (artistName) {
    $('#title').text(artistName);
}
if (gallery) { } else {
    gallery = 0;
}
if (image) { } else {
    image = 0;
}

// Initial loading of the page
function loadPage(userId) {
    uid = userId;

    // Load data from Firebase and render all of it
    loadData(() => {
        $('title').text(draftData[draftId].name + ' | IHS Artists Console');
        $('#home-button').attr('href', '../?id=' + draftId)

        resizeWindow();
        renderArtistData(draftData[draftId].data.artistData[artist]);
    });
}

//Load the draft data from Firebase
function loadData(callback) {
    firebase.database().ref('users/' + uid + '/drafts').on('value', snapshot => {
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
function goHome() {
    window.location = '.../';
}

// Resize parts of the page based on the window size
function resizeWindow() {
    var today = new Date();
    $('#footer').html($('#footer').html().split('**YEAR**').join(today.getFullYear().toString()));

    if (window.innerWidth < 1050) {
        $('#title-container').css('margin-top', '8px');
    }
    if (window.innerWidth < 900) {
        $('#title-container').css('margin-top', '3px');
    }
    if (window.innerWidth < 700) {
        deviceType = 'mobile';

        $('#title').css('font-size', '25px');

        $('#title-container').css('margin-left', '18px').css('margin-top', '0')
        $('#title-container').css('width', 'calc(100% - 120px)');

        $('#home-button').css('margin-right', '10px').css('margin-left', '10%');
        $('#home-button-container').css('margin-bottom', '30px').css('top', '10px');

        $('#main-image-padding-container').css('max-width', 'calc(100% - 18px)');
        $('#main-image-container').css('width', 'calc(100% - 18px)').css('text-align', 'center').css('margin-left', '8px').css('margin-right', '8px').css('margin-top', '10px');

        $('#image-description').css('width', 'calc(100% - 30px)').css('margin-left', '15px').css('margin-right', '15px');

        $('#gallery-navigator').css('margin-top', '30px').css('margin-left', '25px');
        $('#statement-button').css('margin-left', '25px');

        $('#gallery-container').css('top', '18px').css('margin', '10px').css('max-width', maxMobileWidth + 'px');
        $('#gallery-center-container').css('text-align', 'center');

        $('#content').css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');

        $('#statement-box').css('padding', statementMobilePadding / 2 + 'px').css('padding-left', statementMobilePadding / 4 + 'px').css('padding-right', statementMobilePadding / 4 + 'px').css('width', 'calc(100% - ' + (statementMobilePadding / 2 + 30) + 'px)').css('margin-left', '15px').css('margin-right', '15px');
        $('#statement').css('padding-left', statementMobilePadding / 4 + 'px').css('padding-right', statementMobilePadding / 4 + 'px').css('font-size', '16px');

        $('#overlay-close').css('font-size', '32px').css('right', '15px').css('top', '15px');

        $('#footer').css('margin-left', '15px').css('margin-right', '15px');

        if (window.innerWidth < 395) {
            $('#content').css('margin-top', '0px');
        }
    }
}

// Resize the main image based on a number of factors
function resizeImage() {

    var naturalWidth = $('#main-image')[0].naturalWidth;
    var naturalHeight = $('#main-image')[0].naturalHeight;
    var containerWidth = $('#main-image-container').width();

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
    if (deviceType == 'desktop') {
        containerWidth -= desktopGalleryWidth;

        if (scaleType == 'width') {
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if (scaleType == 'height') {
            $('#main-image').css('height', containerWidth * (naturalHeight / naturalWidth) + 'px').css('max-height', '450px');
        }
        if (scaleType == 'vertical-scroll') {
            $('#main-image-scroll-container').css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if (scaleType == 'horizontal-scroll') {
            $('#main-image-scroll-container').css('overflow-x', 'scroll');
            $('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px');
            $('#main-image').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
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
    if (deviceType == 'mobile') {
        containerWidth -= 23;
        if (containerWidth > maxMobileWidth) {
            containerWidth = maxMobileWidth;
        }

        if (scaleType == 'width') {
            $('#main-image').css('width', containerWidth + 'px');
        }
        if (scaleType == 'height') {
            $('#main-image').css('max-width', containerWidth + 'px').css('height', '450px');
            if ($('#main-image').width() == maxMobileWidth || $('#main-image').width() == $('#main-image-container').width() - 23) {
                $('#main-image').css({ height: '' });
            }
        }
        if (scaleType == 'vertical-scroll') {
            $('#main-image-scroll-container').css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if (scaleType == 'horizontal-scroll') {
            $('#main-image-scroll-container').css('overflow-x', 'scroll');
            $('#main-image-padding-container').css('width', containerWidth + 'px');
            $('#main-image').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
        }
    }

    $("#image-zoom-box").html('');
    $("#main-image-padding-container").clone().appendTo("#image-zoom-box");

}

// Build the page based on the data from the draft
function renderArtistData(artistData) {

    console.log(artistData);

    $('#gallery-navigator').html(`<p id='gallery-navigator-text'>Gallery:</p>`);
    $('#gallery-container').html('');

    $('#title').text(artistData.name.split("%39").join("'"));

    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + draftId + '&a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + artistData.name.replace("'", "\\'");

        if (statement == true) {
            newurl += '&s=true';
        }
        window.history.pushState({ path: newurl }, '', newurl);
    }

    $('#image-description').text(artistData.images[image].name);
    if (deviceType === 'desktop') {
        $('#gallery-navigator').css('margin-top', '-' + ($('#image-description').height() + 532) + 'px');
    }

    if (artistData.statement.type === 'text') {
        $('meta[name=description]').attr('content', artistData.statement.content.split('\n').join(' '));
        $('#statement').html(artistData.statement.content.split('\n').join('<br>'));

        if (statement) {
            viewStatement();
        }
    }
    if (artistData.statement.type === 'image') {
        $('#statement').html('<img alt="Artist statement of ' + artistData.name.split("%39").join("'")); $('title').text(artistData.name.split("%39").join("'") + '" id="statement-image" src="' + websiteBaseUrl + 'images/statement--' + artist + '.jpg">');
        $('#statement-image').on('load', () => {
            $('#statement-image').css('width', '100%');
            if (statement) {
                viewStatement();
            }
        });
    }

    if (artistData.images[image].type === 'image') {

        // Uploaded image that is from Firebase
		if (artistData.images[image].newImage) {

			// Has new image - load from Firebase
			if (artistData.images[image].newImage.hasImage) {
				let id = artistData.images[image].newImage.newImageId;
				if (customImageCache[id]) {
					$('#main-image').attr('alt', 'Artwork: ' + artistData.images[image].name).on('load', resizeImage).attr('src', customImageCache[id]);
				} else {
					firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
						customImageCache[id] = url;
						$('#main-image').attr('alt', 'Artwork: ' + artistData.images[image].name).on('load', resizeImage).attr('src', url);
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
			}
		}
		// Image that is from ihsartists.net
		else {
            $('#main-image').on('load', resizeImage).attr('alt', 'Artwork: ' + artistData.images[image].name).attr('src', websiteBaseUrl + 'images/image--' + artist + '-' + image + '.jpg');
		}
    }

    for (var i = 0; i < artistData.galleries[gallery].order.length; i++) {

        // Determine if it is new image from firebase or should be loaded from website
        if (artistData.images[artistData.galleries[gallery].order[i]].newThumb) {
            if (artistData.images[artistData.galleries[gallery].order[i]].newThumb.hasThumb) {
                let id = artistData.images[artistData.galleries[gallery].order[i]].newThumb.newThumbId;
                $('#gallery-container').append(`
                    <a href='./?id=${draftId}&a=${artist}&g=${gallery}&i=${artistData.galleries[gallery].order[i]}&t=${$.urlParam("t")}'>
                        <img class='gallery-image ${id}' src=''>
                    </a>
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
                    <a href='./?id=${draftId}&a=${artist}&g=${gallery}&i=${artistData.galleries[gallery].order[i]}&t=${$.urlParam("t")}'>
                        <img alt="Thumbnail image of artwork: ${artistData.images[artistData.galleries[gallery].order[i]].name}" class="gallery-image-placeholder gallery-image">
                    </a>
                `);
            }
        } else {
            $('#gallery-container').append(`
                <a href='./?id=${draftId}&a=${artist}&g=${gallery}&i=${artistData.galleries[gallery].order[i]}&t=${$.urlParam("t")}'>
                    <img alt="Thumbnail image of artwork: ${artistData.images[artistData.galleries[gallery].order[i]].name}" class="gallery-image" src="${websiteBaseUrl}images/image-thumb--${artist}-${artistData.galleries[gallery].order[i]}.jpg">
                </a>
			`);
        }
    }

    if (deviceType === 'desktop') {
        $('#gallery-container').css('height', $('#gallery-container').width() * 0.75 + 'px');
        $('.gallery-image').css('height', ($('#gallery-container').width() / 4 - 4) + 'px');
    } else {
        $('#gallery-container').css('text-align', 'left');
    }

    for (var i = 0; i < artistData.galleries.length; i++) {
        if (i === parseInt(gallery)) {
            $('#gallery-navigator-text').append('<a class="gallery-navigator-tab" id="gallery-navigator-tab--current">' + artistData.galleries[i].name + '</a>');
        } else {
            $('#gallery-navigator-text').append('<a class="gallery-navigator-tab" href="./?id=' + draftId + '&a=' + artist + '&g=' + i + '&i=' + artistData.galleries[i].order[0] + '&t=' + $.urlParam('t') + '">' + artistData.galleries[i].name + '</a>');
        }
    }

    if (artistData.images[image].type === 'video') {
        document.getElementById('main-image-scroll-container').outerHTML = '<iframe width="100%" height="100%" src="' + artistData.images[image].embed + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

        var containerWidth = $('#main-image-container').width();
        if (deviceType == 'mobile') {
            $('#main-image-padding-container').css('max-width', 'calc(100% - 18px)').width('100%').height(containerWidth * 0.5625);
        } else {
            containerWidth -= desktopGalleryWidth;
            $('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px').height(containerWidth * 0.5625).css('max-height', '337.5px');

            if ($('#main-image-container').height() < desktopPageHeight) {
                $('#main-image-container').css('margin-top', (desktopPageHeight - $('#main-image-padding-container').height()) + 'px');

                if (parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)) {
                    $('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
                }
            }
        }
    }
}

// Statement popup functions
function hideStatement() {
    $('#overlay').css('display', 'none');
    $('#statement-container').css('display', 'none');
    $('#content').css('filter', 'none');
    $('body').css('height', '100%').css('overflow', 'scroll');
    $('#overlay-close').css('display', 'none');

    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + draftId + '&a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + $.urlParam('t');
        window.history.pushState({ path: newurl }, '', newurl);
    }

    statement = null;
}
function viewStatement() {

    $('#overlay').css('display', 'block');
    $('#statement-container').css('display', 'block');
    $('#content').css('filter', 'blur(4px)');
    $('body').css('height', '100%').css('overflow', 'hidden');
    $('#overlay-close').css('display', 'block');

    if (deviceType == 'mobile') {
        statementPadding = statementMobilePadding;
    }

    if ($('#statement').height() > $('#statement-container').height() - statementPadding) {
        $('#statement-box').css('height', 'calc(100% - ' + statementPadding + 'px)');
        $('#statement').css('overflow-y', 'scroll');
    } else {
        $('#statement-box').css('margin-top', ($('#statement-container').height() - $('#statement').height() - statementPadding) / 2);
    }

    $(document).mouseup(function (e) {
        var container = $('#statement-box');
        if (!container.is(e.target) && container.has(e.target).length == 0) {
            hideStatement();
        }
    });

    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?id=' + draftId + '&a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + $.urlParam('t') + '&s=true';
        window.history.pushState({ path: newurl }, '', newurl);
    }

    statement = true;
}

// Image popup functions
function collapseImage() {
    $('#overlay').css('display', 'none');
    $('#image-zoom-container').css('display', 'none');
    $('#content').css('filter', 'none');
    $('body').css('height', '100%').css('overflow', 'scroll');
    $('#overlay-close').css('display', 'none');
}
function expandImage() {

    $('#overlay').css('display', 'block');
    $('#image-zoom-container').css('display', 'block');
    $('#content').css('filter', 'blur(4px)');
    $('body').css('height', '100%').css('overflow', 'hidden');
    $('#overlay-close').css('display', 'block');

    if (deviceType == 'mobile') {
        statementPadding = statementMobilePadding;
    }

    if ($('#main-image-padding-container').height() > $('#image-zoom-container').height() - statementPadding) {
        $('#image-zoom-box').css('height', '100%');
    } else {
        $('#image-zoom-box').css('margin-top', ($('#image-zoom-container').height() - $('#main-image-padding-container').height()) / 2);
    }

    $(document).mouseup(function (e) {
        var container = $('#image-zoom-box');
        if (!container.is(e.target) && container.has(e.target).length == 0) {
            collapseImage();
        }
    });
}