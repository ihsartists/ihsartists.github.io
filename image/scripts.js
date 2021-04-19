document.getElementById('main-image').addEventListener('load', resizeImage)

// Determine the device type from window size
var deviceType = (window.innerWidth < 700) ? 'mobile' : 'desktop';

// Style configuration global variables
var desktopGalleryWidth = 345;
var maxMobileWidth = 370;
var desktopPageHeight = 500;
var statementPadding = 120;
var statementMobilePadding = 60;

// Resize the image based on its dimensions
function resizeImage() {

    var img = $(this);
    var imgCont = $('#main-image-container');
    var imgScr = $('#main-image-scroll-container');
    var imgPad = $('#main-image-padding-container');

    var naturalWidth = img.naturalHeight;
    var naturalHeight = img.naturalWidth;

    img.removeClass('default');

    var containerWidth = imgCont.width();
   
    var scaleType = 'dynamic';
    if(naturalWidth > 594 && naturalWidth < 608){
        scaleType = 'width';
        if(naturalHeight > 457){
            scaleType = 'vertical-scroll';
        }
    } 
    else if(naturalHeight > 442 && naturalHeight < 458){
        scaleType = 'height';
        if(naturalWidth > 607){
            scaleType = 'horizontal-scroll';
        }
    }
    
    if(scaleType == 'dynamic'){
        if(naturalHeight > 0.75 * naturalWidth){
            naturalWidth = (naturalWidth / naturalHeight) * 450;
            naturalHeight = 450;
            scaleType = 'height';
        } else {
            naturalHeight = (naturalHeight / naturalWidth) * 600;
            naturalWidth = 600;
            scaleType = 'width';
        }
    }
    if(deviceType == 'desktop'){
        containerWidth -= desktopGalleryWidth;
        
        if(scaleType == 'width'){
            img.css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'height'){
            img.css('height', containerWidth * (naturalHeight / naturalWidth) + 'px').css('max-height', '450px');
        }
        if(scaleType == 'vertical-scroll'){
            imgScr.css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
            img.css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'horizontal-scroll'){
            imgScr.css('overflow-x', 'scroll');
            imgPad.css('width', containerWidth + 'px').css('max-width', '600px');
            img.css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
        }
        
        if(img.height() < containerWidth * 0.75){
            imgCont.css('margin-top', (containerWidth * 0.75 - img.height()) + 'px');
            if(parseInt(imgCont.css('margin-top')) < 50 - (510 - desktopPageHeight)){
                imgCont.css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
            }
        }
        if(imgCont.height() < desktopPageHeight){
            imgCont.css('margin-top', (desktopPageHeight - imgPad.height()) + 'px');
            if(parseInt(imgCont.css('margin-top')) < 50 - (510 - desktopPageHeight)){
                imgCont.css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
            }
        }
    }
    if(deviceType == 'mobile'){
        containerWidth -= 23;
        if(containerWidth > maxMobileWidth){
            containerWidth = maxMobileWidth;
        }
        
        if(scaleType == 'width'){
            img.css('width', containerWidth + 'px');
        }
        if(scaleType == 'height'){
            img.css('max-width', containerWidth + 'px').css('height', '450px');
            if(img.width() == maxMobileWidth || img.width() == imgCont.width() - 23){
                img.css({height: ''});
            }
        }
        if(scaleType == 'vertical-scroll'){
            imgScr.css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
            img.css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'horizontal-scroll'){
            imgScr.css('overflow-x', 'scroll');
            imgPad.css('width', containerWidth + 'px');
            img.css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
        }
    }
    
    $("#image-zoom-box").html('');
    $("#main-image-padding-container").clone().appendTo("#image-zoom-box");
    
}

loadData();

// Logic for getting the data from the server
function loadData() {

    // Custom session storage cache logic
    if(artist){
        if (typeof (Storage) !== "undefined") {
            if (sessionStorage.artistData && sessionStorage.artistDataExpire) {
    
                var artistDataExpire = new Date(sessionStorage.artistDataExpire);
                var now = new Date();
    
                if ((now - artistDataExpire) / 1000 / 60 < 15) {
                    renderPage(JSON.parse(sessionStorage.artistData)[artist]);
                    preloadFrontData();
                } else {
                    loadArtistData(true);
                }
            } else {
                loadArtistData(true);
            }
        } else {
            loadArtistData(false);
        }
    } else {
        window.location = '/404.html';
    }

    // Get the artist data from the server, render the page, and store to custom cache
    async function loadArtistData(store) {

        // Request data and render page
        let res = await fetch('/data/artist-data.json');
        let artistData = await res.json();
        renderPage(artistData[artist]);

        // Store to custom cache
        if (store) {
            sessionStorage.artistData = JSON.stringify(artistData);
            sessionStorage.artistDataExpire = new Date();
            preloadFrontData();
        }
    }

    // Get the front data from the server and store to custom cache
    async function preloadFrontData() {
        if (sessionStorage.frontData && sessionStorage.frontDataExpire) {
            var frontDataExpire = new Date(sessionStorage.frontDataExpire);
            var now = new Date();

            if ((now - frontDataExpire) / 1000 / 60 <= 15) {
                return;
            }
        }

        let res = await fetch('/data/front-data.json');
        let frontData = await res.json();
        sessionStorage.frontData = JSON.stringify(frontData);
        sessionStorage.frontDataExpire = new Date();
    }
}

// Render the image page
function renderPage(artistData){

    // Determine if data is valid
    (() => {
        if(artistData) if(artistData.galleries[gallery]) if(artistData.images[image]) return;
        location = '/404.html';
    })();
    
    // Add artist name and image description to page
    $('#title').text(artistData.name.split("%39").join("'")); $('title').text(artistData.name.split("%39").join("'"));
    $('#image-description').text(artistData.images[image].name);
    
    if(deviceType === 'desktop'){
        $('#gallery-navigator').css('margin-top', '-' + ($('#image-description').height() + 532) + 'px');
    }
    
    if(artistData.statement.type === 'text'){
        $('meta[name=description]').attr('content', artistData.statement.content.split('\n').join(' '));
        $('#statement').html(artistData.statement.content.split('\n').join('<br>'));
    } else {
        $('#statement').html('<img alt="Artist statement of ' + artistData.name.split("%39").join("'")); $('title').text(artistData.name.split("%39").join("'") + '" id="statement-image" src="/images/statement--' + artist + '.jpg">');
    }
   
    for(let i = 0; i < artistData.galleries[gallery].order.length; i++){
        $('#gallery-container').append(`
            <a href='/image/?a=${artist}&g=${gallery}&i=${artistData.galleries[gallery].order[i]}&t=${artistName}'>
                <img alt="Thumbnail image of artwork: ${artistData.images[artistData.galleries[gallery].order[i]].name}" class="gallery-image" src="/images/image-thumb--${artist}-${artistData.galleries[gallery].order[i]}.jpg">
            </a>
        `);
    }
    
    for(let i = 0; i < artistData.galleries.length; i++){
        if(i === parseInt(gallery)) {
            $('#gallery-navigator-text').append('<a class="gallery-navigator-tab" id="gallery-navigator-tab--current">' + artistData.galleries[i].name + '</a>');
        } else {
            $('#gallery-navigator-text').append('<a class="gallery-navigator-tab" href="/image/?a=' + artist + '&g=' + i + '&i=' + artistData.galleries[i].order[0] + '&t=' + artistName + '">' + artistData.galleries[i].name + '</a>');
        }
    }
    
    if(artistData.images[image].type === 'video'){
        $('#main-image-scroll-container')[0].outerHTML = `<iframe width="100%" height="100%" src="${artistData.images[image].embed}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        $('#main-image-container').show();
        
        var containerWidth = $('#main-image-container').width();
        if(deviceType == 'mobile'){
            $('#main-image-padding-container').css('max-width','calc(100% - 18px)').width('100%').height(containerWidth * 0.5625);
        } else {
            containerWidth -= desktopGalleryWidth;
            $('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px').height(containerWidth * 0.5625).css('max-height', '337.5px');
            
            if($('#main-image-container').height() < desktopPageHeight){
                $('#main-image-container').css('margin-top', (desktopPageHeight - $('#main-image-padding-container').height()) + 'px');
                
                if(parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)){
                    $('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
                }
            }
        }
    }

    // Update the current year in the footer
    $('.current-year').text(new Date().getFullYear().toString());

    // Revise the url if it is incorrect
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + artistData.name.replace("'", "\\'");
        window.history.pushState({path:newurl},'',newurl);
    }
}

// Expand image in new tab
function expandImage(){
    window.open('/images/image--' + artist + '-' + image + '.jpg', '_blank');
}

// Toggle the statement box
function hideStatement(){
    $('#overlay').hide();
    $('#statement-container').hide();
    $('#page-container').css('filter', 'none');
    $('body').css('height', '100%').css('overflow', 'scroll');
    $('#overlay-close').hide()
    
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + $.urlParam('t');
        window.history.pushState({path:newurl},'',newurl);
    }
    
    statement = null;
}
function viewStatement(){
    
    $('#overlay').show();
    $('#statement-container').show();
    $('#page-container').css('filter', 'blur(4px)');
    $('body').css('height', '100%').css('overflow', 'hidden');
    $('#overlay-close').show();
    
    if(deviceType == 'mobile'){
        statementPadding = statementMobilePadding;
    }
    
    if($('#statement').height() > $('#statement-container').height() - statementPadding){
        $('#statement-box').css('height', 'calc(100% - ' + statementPadding + 'px)');
        $('#statement').css('overflow-y', 'scroll');
    } else {
        $('#statement-box').css('margin-top', ($('#statement-container').height() - $('#statement').height() - statementPadding) / 2);
    }
    
    $(document).mouseup(function(e) {
        var container = $('#statement-box');
        if (!container.is(e.target) && container.has(e.target).length == 0){
            hideStatement();
        }
    });
    
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + $.urlParam('t') + '&s=true';
        window.history.pushState({path:newurl},'',newurl);
    }
    
    statement = true;
}
