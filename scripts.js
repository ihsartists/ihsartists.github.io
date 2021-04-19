
loadData();

// Logic for getting the data from the server
function loadData() {

    // Custom session storage cache logic
    if (typeof (Storage) !== "undefined") {
        if (sessionStorage.frontData && sessionStorage.frontDataExpire) {

            var frontDataExpire = new Date(sessionStorage.frontDataExpire);
            var now = new Date();

            if ((now - frontDataExpire) / 1000 / 60 < 15) {
                renderPage(JSON.parse(sessionStorage.frontData));
                preloadArtistData();
            } else {
                loadFrontData(true);
            }
        } else {
            loadFrontData(true);
        }
    } else {
        loadFrontData(false);
    }

    // Get the front data from the server, render the page, and store to custom cache
    async function loadFrontData(store) {

        // Request data and render page
        let res = await fetch('/data/front-data.json');
        let frontData = await res.json();
        renderPage(frontData);

        // Store to custom cache
        if (store) {
            sessionStorage.frontData = JSON.stringify(frontData);
            sessionStorage.frontDataExpire = new Date();
            preloadArtistData();
        }
    }

    // Get the artist data from the server and store to custom cache
    async function preloadArtistData() {
        if (sessionStorage.artistData && sessionStorage.artistDataExpire) {
            var artistDataExpire = new Date(sessionStorage.artistDataExpire);
            var now = new Date();

            if ((now - artistDataExpire) / 1000 / 60 <= 15) {
                return;
            }
        }

        let res = await fetch('/data/artist-data.json');
        let artistData = await res.json();
        sessionStorage.artistData = JSON.stringify(artistData);
        sessionStorage.artistDataExpire = new Date();
    }
}

// Render the front page
function renderPage(frontData) {

    // Determine the device type from window size
    let deviceType = (window.innerWidth < 700) ? 'mobile' : 'desktop';

    // Go through each year and add it to page if it isn't hidden
    for (var i = frontData.years.length - 1; i > -1; i--) {

        if (!frontData.years[i].name.toLowerCase().includes('hidden')) {
            $('#years').append(`<div class='year' id='year-${i}'><h2 class='year-name'>${frontData.years[i].name}</h2></div>`);

            // Go through each artist for the year and add to page
            for (var j = 0; j < frontData.years[i][deviceType].length; j++) {
                $('#year-' + i).append(`
                    <a href="image/?a=${frontData.years[i][deviceType][j]}&g=${frontData[frontData.years[i][deviceType][j]].link[0]}&i=${frontData[frontData.years[i][deviceType][j]].link[1]}&t=${frontData[frontData.years[i][deviceType][j]].name.split("'").join("\\'")}" class="artist">
                        <img alt="Thumbnail image for ${frontData[frontData.years[i][deviceType][j]].name}" class="artist-thumb" src="/images/artist-thumb--${frontData.years[i][deviceType][j]}.jpg">
                        <div class="artist-bottom">
                            <p class="artist-name">${frontData[frontData.years[i][deviceType][j]].name}</p>
                        </div>
                    </a>
                `);
            }
        }
    }

    // Update the current year in the footer
    $('.current-year').text(new Date().getFullYear().toString());

    initSearch();
}

// Initiate the functions needed to make the search box work
function initSearch() {

    // When search button is clicked
    window.expandSearch = function () {
        $('#search-input')
            .val('')
            .removeClass('material-icons')
            .addClass('search-input-on')
            .removeAttr('onmousedown')
            .attr('readOnly', false)
    }
    $('#search-input').focusin(expandSearch);

    // When the search field is cleared
    window.clearSearch = function () {
        $('.artist').show();
        $('.year-name').show();
        $('#search-failed').hide();
        $('#search-input')
            .removeAttr('onmousedown')
            .attr('readOnly', false)
            .val('')
            .focus();
        $('#search-cancel').hide();
        $('#search-box').css('margin-bottom', '0px');
    }

    // When the user clicks off of the search field
    $('#search-input').focusout(function () {
        if ($('#search-input').val().length === 0 || $('#search-input').val() === 'search') {
            $('#search-input')
                .addClass('material-icons')
                .removeClass('search-input-on')
                .val('search')
                .attr('onmousedown', 'expandSearch()')
                .attr('readOnly', false);

        }
    });

    // Create a contains selector that is case insensitive
    jQuery.expr[':'].icontains = function (a, i, m) {
        return jQuery(a).text().toUpperCase()
            .indexOf(m[3].toUpperCase()) >= 0;
    };

    // When the searchbox is updated, show updated search results
    $("#search-input").keyup(function () {

        // Conditional styles for the search box
        if ($(this).val()) {
            $('#search-cancel').css('display', 'inline-block');
            $('#search-box').css('margin-bottom', '-21px');
        }
        else {
            $('#search-cancel').hide();
            $('#search-box').css('margin-bottom', '0px');
        }

        // Hide all the artists that do not match
        $(`.artist`).hide();
        $(`.artist:icontains(${$(this).val()})`).show();

        // Hide years with no mathces
        $(".year").each(function () {
            if ($(this).children('.artist:visible').length === 0) {
                $(this).children('.year-name').hide();
            } else {
                $(this).children('.year-name').show();
            }
        });

        // If there are no results, show an error message
        if ($('.year-name:visible').length === 0) {
            $('#search-failed').show();
        } else {
            $('#search-failed').hide();
        }
    });
}