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
                        // Save GitHub access information
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

// Intitialize some global variables
var uid;
var fadeTimer;
var containerTimer;
var draftData = [];
var websiteBaseUrl = 'https://ihsartists.net/';

// Initial loading of the page
function loadPage(userId) {
    uid = userId;

    loadData(data => {
        draftData = data;
        renderDrafts();
    });

    prepareInputs();
}

// Add the draft elements to the DOM
function renderDrafts() {
    for (var i = 0; i < draftData.length; i++) {
        $('#existing-drafts').append("<div id='draft-" + i + "' class='draft'><input class='draft-title' id='draft-" + i + "-title' value='" + draftData[i].name + "'><div class='open-button action-button' onclick='openDraft(" + i + ")'><span class='action-button-text'>Open</span></div><div class='delete-button action-button' onclick='deleteDraft(" + i + ")'><span class='action-button-text'>Delete</span></div></div>");
    }
    prepareInputs();
}

// Loads the current draft data from Firebase
function loadData(callback) {
    firebase.database().ref('users/' + uid + '/drafts').once('value').then(snapshot => {
        if (snapshot.val()) {
            callback(JSON.parse(snapshot.val()));
        } else {
            callback([]);
        }
        console.log('Data loaded', draftData);
    });
}

// Saves the current draft data to Firebase
function saveData() {
    firebase.database().ref('users/' + uid + '/drafts').set(JSON.stringify(draftData));
    console.log('Data saved', draftData);
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
function confirmBox(deleteFunction, cancelFunction) {
    $('#page-container').css('filter', 'blur(3px)');
    $('#confirm-box-container').css('display', 'block');
    $('#background-blur').css('display', 'block');
    $('#top-bar-container').css('top', '-8px');

    confirmCancel = cancelFunction;
    confirmDelete = deleteFunction;
}

// Goes to editor when the user opens a draft
function openDraft(id) {
    window.location = './editor/?id=' + id;
}

// Updates DOM and elements on delete confirmed
function deleteDraft(id) {

    confirmBox(function () {
        var removed = draftData.splice(id, 1);
        $('#existing-drafts').html('');

        bottomAlert('Draft deleted.', '#ec407a', 2000);

        saveData();
        renderDrafts();

        closeConfirmBox();
    }, function () {
        closeConfirmBox();
    });
}

// Checks new names for errors and then updates data
function renameDraft(id, text) {
    if (draftData[id].name != text.trim()) {
        if (text.trim() != '') {
            if (text.trim().length < 24) {
                draftData[id].name = text.trim();
                bottomAlert('Renamed.', '#757575', 3000);
            } else {
                bottomAlert('Error: too long.', '#ef5350', 3000);
            }
        } else {
            bottomAlert('Error: please enter a name.', '#ef5350', 3000);
        }
    }
    $('#draft-' + id + '-title').val(draftData[id].name);

    saveData();
}

// Initializes the draft name input elements so they select all on focus
function prepareInputs() {
    $(".draft-title").focus(
        function () {
            $(this).select();
        }
    ).blur(
        function () {
            renameDraft(parseInt($(this).parent().attr('id').split('-')[1]), $(this).val());
        }
    ).keyup(
        function (e) {
            if (e.keyCode == 13) {
                $(this).trigger('blur');
            }
        }
    );
}

// Creates a new draft and adds it to the data and DOM
function createNewDraft() {
    $('#existing-drafts').append("<div id='draft-" + draftData.length + "' class='draft'><input class='draft-title' id='draft-" + draftData.length + "-title' value='Untitled Draft'><div class='open-button action-button' onclick='openDraft(" + draftData.length + ")'><span class='action-button-text'>Open</span></div><div class='delete-button action-button' onclick='deleteDraft(" + draftData.length + ")'><span class='action-button-text'>Delete</span></div></div>");

    prepareInputs();

    //Initialize the new draft with the latest data from the website
    $.get(websiteBaseUrl + 'data/front-data.json', (frontData) => {
        $.get(websiteBaseUrl + 'data/artist-data.json', (artistData) => {
            draftData[draftData.length] = {
                name: 'Untitled Draft',
                data: {
                    frontData: frontData,
                    artistData: artistData,
                },
                newImages: []
            };

            saveData();
        });
    });

    bottomAlert('Draft created.', '#26a69a', 3000);
}