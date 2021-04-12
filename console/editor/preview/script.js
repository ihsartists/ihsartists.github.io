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
var maxMobileWidth = 370;

// Initial loading of the page
function loadPage(userId) {
    uid = userId;

    // Load data from Firebase and render all of it
    loadData(() => {
        $('title').text(draftData[draftId].name + ' | IHS Artists Console');

        resizeWindow();
        renderFrontData(draftData[draftId].data.frontData);
        resizeWindow();
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
    window.location = '../';
}

// Resize parts of the page based on the window size
function resizeWindow() {
    if (window.innerWidth < 1050) {
        $('#title').css('margin-top', '30px');
    }
    if (window.innerWidth < 900) {
        $('#title').css('margin-top', '25px');
    }
    if (window.innerWidth < 700) {
        deviceType = 'mobile';
        $('#title').css('margin-left', '4%');
        $('#search-failed').css('margin-left', '25px');
        $('#search-input').css('margin-right', '10px').css('margin-left', '10px');
        $('#search-cancel').css('right', 'calc(4% + 10px)');
        $('#title').css('margin-top', '20px');

        $('#content').css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');

        if (window.innerWidth < 395) {
            $('#content').css('margin-top', '0px');
        }
    }
}

// Build the page based on the data from the draft
function renderFrontData(frontData) {

    console.log(frontData);
    $('#content').html(`
        <h1 id='title'>IHS Artists</h1>
        <div id='search-box'>
            <input id='search-input' value='search' class='material-icons' type='text'
                onclick='expandSearch()'>
            <br>
            <div id='search-cancel' onclick='clearSearch()'>x</div>
        </div>
        <h3 id='search-failed'>No search results.</h3>
    `);

    for (var i = frontData.years.length - 1; i > -1; i--) {
        $('#content').append('<div class="year" id="year' + i + '"><h2 class="year-name">' + frontData.years[i].name + '</h2></div>');

        for (var j = 0; j < frontData.years[i][deviceType].length; j++) {
            var artistId = frontData.years[i][deviceType][j];

            if (frontData[artistId].newThumb) {
                if (frontData[artistId].newThumb.hasThumb) {
                    let id = frontData[artistId].newThumb.newThumbId;
                    var thumb = `<img class="artist-thumb ${id}" src=""></img>`;
                    if (customImageCache[id]) {
                        thumb = `<img class="artist-thumb ${id}" src="${customImageCache[id]}"></img>`;
                    } else {
                        firebase.storage().ref().child('user/' + uid + '/' + id + '.jpg').getDownloadURL().then(function (url) {
                            customImageCache[id] = url;
                            $('.' + id).attr('src', url);
                        });
                    }
                } else {
                    var thumb = `<span class='artist-placeholder'></span>`;
                }
            } else {
                var thumb = `<img class="artist-thumb" src="${websiteBaseUrl}/images/artist-thumb--${artistId}.jpg"></img>`;
            }

            $('#year' + i).append(`
                <a href="./image/?id=${draftId}&a=${frontData.years[i][deviceType][j]}&g=${frontData[frontData.years[i][deviceType][j]].link[0]}&i=${frontData[frontData.years[i][deviceType][j]].link[1]}" id="artist-${artistId}" class="artist">
                    ${thumb}
                    <div class="artist-bottom">
                        <p class="artist-name">${frontData[artistId].name}</p>
                    </div>
                </a>
            `);
        }

        if (deviceType == 'mobile') {
            $('.artist').css('width', 'calc(31.33% - 3px)').css('padding-top', '1.5%');
            $('.year-name').css('margin-left', '4%');
            $('.artist-name').css('font-size', '14px');
            $('.artist-bottom').css('height', '43px');
        }
    }
    $('#content').append("<div id='footer'><span id='footer-text'>© Copyright **YEAR**, All Rights Reserved<br><br>Website designed and coded by Josh Chang.</span></div>");

    var today = new Date();
    $('#footer').html($('#footer').html().split('**YEAR**').join(today.getFullYear().toString()));

    if (deviceType == 'mobile') {
        $('#footer').css('margin-left', '15px').css('margin-right', '15px');
    }
}

// Page interactivity functions
function expandSearch() {
    $('#search-input').removeClass('material-icons').attr('onclick', '').css('background', '#e0e0e0').attr('readOnly', false);

    if ($('#search-input').val() == 'search') {
        $('#search-input').val('');
    }
    if (deviceType == 'mobile') {
        $('#search-input').css('width', 'calc(92% - 11px)');
    }
    if (deviceType == 'desktop') {
        $('#search-input').css('width', 'calc(96% - 11px)');
    }
}
function clearSearch() {
    $(".artist").show();
    $('.year-name').show();
    $('#search-failed').hide();
    $('#search-input').attr('onclick', '').attr('readOnly', false);
    $('#search-input').focus();
    $("#search-cancel").css('display', 'none');
    $('#search-box').css('margin-bottom', '0px');
    $('#search-input').val('');
}
$('#search-input').focusout(function () {
    if ($('#search-input').val().length == 0 || $('#search-input').val() == 'search') {
        $('#search-input').addClass('material-icons').attr('onclick', 'expandSearch()').val('search').css('width', '50px').css('background', 'white').attr('readOnly', false);

    } else {
        $('#search-input').focus().attr('onclick', 'expandSearch()').attr('readOnly', true);
    }
});
$('#search-input').hover(function () {
    $('#search-input').css('background', '#e0e0e0');
});
$('#search-input').mouseout(function () {
    if ($('#search-input').is(":focus") == false) {
        $('#search-input').css('background', 'white');
    }
});

$("#search-input").keyup(function () {
    if ($(this).val()) {
        $("#search-cancel").css('display', 'inline-block');
        $('#search-box').css('margin-bottom', '-21px');
    }
    else {
        $("#search-cancel").css('display', 'none');
        $('#search-box').css('margin-bottom', '0px');
    }
    var searchQuery = $(this).val().toLocaleLowerCase().trim();
    $(".artist").each(function () {
        if (boyerMooreSearch($(this).text().toLocaleLowerCase(), searchQuery) == -1) {
            $(this).hide();
        } else {
            $(this).show();
        }
    });
    $(".year").each(function () {
        if ($(this).children('.artist:visible').length == 0) {
            $(this).children('.year-name').hide();
        } else {
            $(this).children('.year-name').show();
        }
    });
    if ($('.year-name:visible').length == 0) {
        $('#search-failed').show();
    } else {
        $('#search-failed').hide();
    }
});
$("button").click(function () {
    $("input").val('');
    $(this).hide();
});


// Helper functions
function boyerMooreSearch(text, pattern) {
    if (pattern.length === 0) {
        return 1;
    }
    let charTable = makeCharTable(pattern);
    let offsetTable = makeOffsetTable(pattern);

    for (let i = pattern.length - 1, j; i < text.length;) {
        for (j = pattern.length - 1; pattern[j] == text[i]; i--, j--) {
            if (j === 0) {
                return i;
            }
        }
        const charCode = text.charCodeAt(i);
        i += Math.max(offsetTable[pattern.length - 1 - j], charTable[charCode]);
    }
    return -1;
}
function makeCharTable(pattern) {
    let table = [];
    for (let i = 0; i < 65536; i++) {
        table.push(pattern.length);
    }
    for (let i = 0; i < pattern.length - 1; i++) {
        const charCode = pattern.charCodeAt(i);
        table[charCode] = pattern.length - 1 - i;
    }
    return table;
}
function makeOffsetTable(pattern) {
    let table = [];
    table.length = pattern.length;
    let lastPrefixPosition = pattern.length;

    for (let i = pattern.length; i > 0; i--) {
        if (isPrefix(pattern, i)) {
            lastPrefixPosition = i;
        }
        table[pattern.length - i] = lastPrefixPosition - 1 + pattern.length;
    }
    for (let i = 0; i < pattern.length - 1; i++) {
        const slen = suffixLength(pattern, i);
        table[slen] = pattern.length - 1 - i + slen;
    }
    return table;
}
function isPrefix(pattern, p) {
    for (let i = p, j = 0; i < pattern.length; i++, j++) {
        if (pattern[i] != pattern[j]) {
            return false;
        }
        return true;
    }
}
function suffixLength(pattern, p) {
    let len = 0;
    for (let i = p, j = pattern.length - 1; i >= 0 && pattern[i] == pattern[j]; i--, j--) {
        len += 1;
    }
    return len;
}