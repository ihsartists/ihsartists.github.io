var deviceType = 'desktop';

var desktopGalleryWidth = 340;
var maxMobileWidth = 370;

function resizeWindow() {
    if(window.innerWidth < 1050){
        $('#title-container').css('margin-top', '8px');
    }
    if(window.innerWidth < 900){
        $('#title-container').css('margin-top', '3px');
    }
    if(window.innerWidth < 700){
        deviceType = 'mobile';

        $('#title').css('font-size', '25px');

        $('#title-container').css('margin-left', '18px').css('margin-top', '0')
        $('#title-container').css('width', 'calc(100% - 120px)');

        $('#home-button').css('margin-right', '10px').css('margin-left', '10%');
        $('#home-button-container').css('margin-bottom', '30px').css('top', '10px');

        $('#main-image-padding-container').css('max-width', 'calc(100% - 18px)');
        $('#main-image-container').css('width', 'calc(100% - 18px)').css('text-align', 'center').css('margin-left', '8px').css('margin-right', '8px').css('margin-top', '10px');
        
        $('#gallery-container').css('top', '18px').css('margin', '10px').css('max-width', maxMobileWidth + 'px');
        $('#gallery-center-container').css('text-align', 'center');
        
        $('#page-container').css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');
        
        if(window.innerWidth < 395){
            $('#page-container').css('margin-top', '0px');
        }
    }
}
resizeWindow();

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null) {
       return null;
    }
    return decodeURI(results[1]) || 0;
}

var artist = $.urlParam('a');
var artistName = $.urlParam('t');
var gallery = $.urlParam('g');
var image = $.urlParam('i');

if(artistName) {
    $('#title').text(artistName);
    $('title').text(artistName);
}
if(gallery){} else {
    gallery = 0;
}
if(image){} else {
    image = 0;
}

function resizeImage() {
    
    var naturalWidth = $('#main-image')[0].naturalWidth;
    var naturalHeight = $('#main-image')[0].naturalHeight;
    var containerWidth = $('#main-image-container').width();
   
    var scaleType = 'width';
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
    
    if(deviceType == 'desktop'){
        containerWidth -= desktopGalleryWidth;
        
        if(scaleType == 'width'){
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'height'){
            $('#main-image').css('height', containerWidth * (naturalHeight / naturalWidth) + 'px').css('max-height', '450px');
        }
        if(scaleType == 'vertical-scroll'){
            $('#main-image-scroll-container').css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'horizontal-scroll'){
            $('#main-image-scroll-container').css('overflow-x', 'scroll');
            $('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px');
            $('#main-image').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
        }
        
        if($('#main-image').height() < containerWidth * 0.75){
            $('#main-image-container').css('margin-top', (containerWidth * 0.75 - $('#main-image').height()) + 'px');
            if(parseInt($('#main-image-container').css('margin-top')) < 50){
                $('#main-image-container').css('margin-top', '50px');
            }
        }
        if($('#main-image-container').height() < 510){
            $('#main-image-container').css('margin-top', (510 - $('#main-image-padding-container').height()) + 'px');
            console.log(parseInt($('#main-image-container').css('margin-top')));
            if(parseInt($('#main-image-container').css('margin-top')) < 50){
                $('#main-image-container').css('margin-top', '50px');
            }
        }
    }
    if(deviceType == 'mobile'){
        containerWidth -= 23;
        if(containerWidth > maxMobileWidth){
            containerWidth = maxMobileWidth;
        }
        
        if(scaleType == 'width'){
            $('#main-image').css('width', containerWidth + 'px');
        }
        if(scaleType == 'height'){
            $('#main-image').css('max-width', containerWidth + 'px').css('height', '450px');
            if($('#main-image').width() == maxMobileWidth || $('#main-image').width() == $('#main-image-container').width() - 23){
                $('#main-image').css({height: ''});
            }
        }
        if(scaleType == 'vertical-scroll'){
            $('#main-image-scroll-container').css('overflow-y', 'scroll').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'horizontal-scroll'){
            $('#main-image-scroll-container').css('overflow-x', 'scroll');
            $('#main-image-padding-container').css('width', containerWidth + 'px');
            $('#main-image').css('height', containerWidth * 0.75 + 'px').css('max-height', '450px');
        }
    }
}

$('#main-image').attr('src', '/images/image--' + artist + '-' + gallery + '-' + image + '.jpg').on('load', () => {
                
    $('#loader').css('display', 'none');
    $('#main-image-container').css('display', 'block');
    $('#gallery-container').css('display', 'inline-block');
    
    resizeImage();
});

function loadPage(artistData){
        
    console.log(artistData);
    $('#title').text(artistData.name.split("%39").join("'")); $('title').text(artistData.name.split("%39").join("'"));

    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + artistData.name.replace("'", "\\'");
        window.history.pushState({path:newurl},'',newurl);
    }
    if(artistData.galleries[gallery].images[image].type == 'image'){
        $('#main-image').attr('src', '/images/image--' + artist + '-' + gallery + '-' + image + '.jpg').on('load', () => {
            $('#loader').css('display', 'none');
            $('#main-image-container').css('display', 'block');

            resizeImage();
        });
    }
   
    for(var i = 0; i < artistData.galleries[gallery].order.length; i++){
        $('#gallery-container').append("<img class='gallery-image' src='/images/image-thumb--" + artist + "-" + gallery + "-" + artistData.galleries[gallery].order[i] + ".jpg' onclick='window.location=\"/image/?a=" + artist + "&g=" + gallery + "&i=" + artistData.galleries[gallery].order[i] + "&t=" + $.urlParam('t') + "\"'>");
    }
    
    if(deviceType == 'desktop'){
        $('#gallery-container').css('height', $('#gallery-container').width() * 0.75 + 'px');
        $('.gallery-image').css('height', ($('#gallery-container').width() / 4 - 4) + 'px');
    } else {
        $('#gallery-container').css('text-align', 'left');
    }
    
    for(var i = 0; i < Object.keys(artistData.galleries).length; i++){
        if(i == gallery) {
           $('#gallery-navigator-text').append('<b class="gallery-navigator-tab" id="gallery-navigator-tab--current">' + artistData.galleries[i].name + '</b>');
        } else {
            $('#gallery-navigator-text').append('<b class="gallery-navigator-tab" onclick="window.location=\'/image/?a=' + artist + "&g=" + i + "&i=" + artistData.galleries[i].order[0] + "&t=" + $.urlParam('t') + '\'">' + artistData.galleries[i].name + '</b>');
        }
    }
    
    if(artistData.galleries[gallery].images[image].type == 'video'){
        document.getElementById('main-image-scroll-container').outerHTML = '<iframe width="100%" height="100%" src="' + artistData.galleries[gallery].images[image].embed + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

        $('#loader').css('display', 'none');
        $('#main-image-container').css('display', 'block');
        $('#gallery-container').css('display', 'inline-block');
        
        var containerWidth = $('#main-image-container').width();
        if(deviceType == 'mobile'){
            $('#main-image-padding-container').css('max-width','calc(100% - 18px)').width('100%').height(containerWidth * 0.5625);
        } else {
            containerWidth -= desktopGalleryWidth;
            $('#main-image-padding-container').css('width', containerWidth + 'px').css('max-width', '600px').height(containerWidth * 0.5625).css('max-height', '337.5px');
            
            if($('#main-image-container').height() < 510){
                console.log($('#main-image-container').height() );
                $('#main-image-container').css('margin-top', (510 - $('#main-image-padding-container').height()) + 'px');
                
                if(parseInt($('#main-image-container').css('margin-top')) < 50){
                    $('#main-image-container').css('margin-top', '50px');
                }
            }
        }
    }
}

function preloadFrontData(){
    if(sessionStorage.frontData){} else {
        $.get('/data/front-data.json', frontData => {
            sessionStorage.frontData = JSON.stringify(frontData);
            sessionStorage.frontDataExpire = new Date();
        });
    }
}

if(artist){
    if (typeof(Storage) !== "undefined") {
        if(sessionStorage.artistData){
            loadPage(JSON.parse(sessionStorage.artistData)[artist]);
            preloadFrontData();
        } else {
            $.get('/data/artist-data.json', artistData => {
                loadPage(artistData[artist]);
                sessionStorage.artistData = JSON.stringify(artistData);
                sessionStorage.artistDataExpire = new Date();
                preloadFrontData();
            });
        }
    } else {
        $.get('/data/artist-data.json', artistData => {
            loadPage(artistData[artist]);
        });
    }
} else {
    window.location = '/';
}