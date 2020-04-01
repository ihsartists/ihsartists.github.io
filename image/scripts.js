var deviceType = 'desktop';

var desktopGalleryWidth = 345;
var maxMobileWidth = 370;
var desktopPageHeight = 500;
var statementPadding = 120;
var statementMobilePadding = 60;

function resizeWindow() {
    
    var today = new Date();
    $('#footer').html($('#footer').html().split('**YEAR**').join(today.getFullYear().toString()));
    
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
        
        $('#image-description').css('width', 'calc(100% - 30px)').css('margin-left', '15px').css('margin-right', '15px');
        
        $('#gallery-navigator').css('margin-top', '30px').css('margin-left', '25px');
        $('#statement-button').css('margin-left', '25px');
        
        $('#gallery-container').css('top', '18px').css('margin', '10px').css('max-width', maxMobileWidth + 'px');
        $('#gallery-center-container').css('text-align', 'center');
        
        $('#page-container').css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');
        
        $('#statement-box').css('padding', statementMobilePadding / 2 + 'px').css('padding-left', statementMobilePadding / 4 + 'px').css('padding-right', statementMobilePadding / 4 + 'px').css('width', 'calc(100% - ' + (statementMobilePadding / 2 + 30) + 'px)').css('margin-left', '15px').css('margin-right', '15px');
        $('#statement').css('padding-left', statementMobilePadding / 4 + 'px').css('padding-right', statementMobilePadding / 4 + 'px').css('font-size', '16px');
        
        $('#overlay-close').css('font-size', '32px').css('right', '15px').css('top', '15px');
        
        $('#footer').css('margin-left', '15px').css('margin-right', '15px');
        
        if(window.innerWidth < 395){
            $('#page-container').css('margin-top', '0px');
        }
    }
}

resizeWindow();

function hideStatement(){
    $('#overlay').css('display', 'none');
    $('#statement-container').css('display', 'none');
    $('#page-container').css('filter', 'none');
    $('body').css('height', '100%').css('overflow', 'scroll');
    $('#overlay-close').css('display', 'none');
    
    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + $.urlParam('t');
        window.history.pushState({path:newurl},'',newurl);
    }
    
    statement = null;
}
function viewStatement(){
    
    $('#overlay').css('display', 'block');
    $('#statement-container').css('display', 'block');
    $('#page-container').css('filter', 'blur(4px)');
    $('body').css('height', '100%').css('overflow', 'hidden');
    $('#overlay-close').css('display', 'block');
    
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
var statement = $.urlParam('s');

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
            if(parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)){
                $('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
            }
        }
        if($('#main-image-container').height() < desktopPageHeight){
            $('#main-image-container').css('margin-top', (desktopPageHeight - $('#main-image-padding-container').height()) + 'px');
            if(parseInt($('#main-image-container').css('margin-top')) < 50 - (510 - desktopPageHeight)){
                $('#main-image-container').css('margin-top', (50 - (510 - desktopPageHeight)) + 'px');
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
    
    $("#image-zoom-box").html('');
    $("#main-image-padding-container").clone().appendTo("#image-zoom-box");
    
}

$('#main-image').attr('src', '/images/image--' + artist + '-' + gallery + '-' + image + '.jpg').on('load', () => {
                
    $('#loader').css('display', 'none');
    $('#main-image-container').css('display', 'block');
    $('#gallery-container').css('display', 'inline-block');
    $('#footer').css('display', 'block');
    
    resizeImage();
});

function loadPage(artistData){
    
    if(artistData){
        if(artistData.galleries[gallery]){
            if(artistData.galleries[gallery].images[image]){
                console.log(artistData);
            } else {
                window.location = '/404.html';
            }
        } else {
            window.location = '/404.html';
        }
    } else {
        window.location = '/404.html';
    }
    
    $('#title').text(artistData.name.split("%39").join("'")); $('title').text(artistData.name.split("%39").join("'"));

    if (history.pushState) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + artistData.name.replace("'", "\\'");
        
        if(statement == true){
            newurl += '&s=true';
        }
        window.history.pushState({path:newurl},'',newurl);
    }
    
    $('#image-description').text(artistData.galleries[gallery].images[image].name);
    if(deviceType == 'desktop'){
        $('#gallery-navigator').css('margin-top', '-' + ($('#image-description').height() + 532) + 'px');
    }
    
    if(artistData.statement.type == 'text'){
        $('meta[name=description]').attr('content', artistData.statement.content.split('\n').join(' '));
        $('#statement').html(artistData.statement.content.split('\n').join('<br>'));
        
        if(statement){
            viewStatement();
        }
    }
    if(artistData.statement.type == 'image'){
        $('#statement').html('<img id="statement-image" src="/images/statement--' + artist + '.jpg">');
        $('#statement-image').on('load', () => {
            $('#statement-image').css('width', '100%');
            if(statement){
                viewStatement();
            }
        });
    }
    
    if(artistData.galleries[gallery].images[image].type == 'image'){
        $('#main-image').attr('src', '/images/image--' + artist + '-' + gallery + '-' + image + '.jpg').on('load', () => {
            $('#loader').css('display', 'none');
            $('#main-image-container').css('display', 'block');

            resizeImage();
        });
    }
   
    for(var i = 0; i < artistData.galleries[gallery].order.length; i++){
        $('#gallery-container').append(`
            <a href='/image/?a=` + artist + `&g=` + gallery + `&i=` + artistData.galleries[gallery].order[i] + `&t=` + $.urlParam("t") + `'>
                <img class="gallery-image" src="/images/image-thumb--` + artist + `-` + gallery + `-` + artistData.galleries[gallery].order[i] + `.jpg">
            </a>
        `);
    }
    
    if(deviceType == 'desktop'){
        $('#gallery-container').css('height', $('#gallery-container').width() * 0.75 + 'px');
        $('.gallery-image').css('height', ($('#gallery-container').width() / 4 - 4) + 'px');
    } else {
        $('#gallery-container').css('text-align', 'left');
    }
    
    for(var i = 0; i < artistData.order.length; i++){
        if(artistData.order[i] == gallery) {
           $('#gallery-navigator-text').append('<a class="gallery-navigator-tab" id="gallery-navigator-tab--current">' + artistData.galleries[artistData.order[i]].name + '</a>');
        } else {
            $('#gallery-navigator-text').append('<a class="gallery-navigator-tab" href="/image/?a=' + artist + '&g=' + i + '&i=' + artistData.galleries[artistData.order[i]].order[0] + '&t=' + $.urlParam('t') + '">' + artistData.galleries[artistData.order[i]].name + '</a>');
        }
    }
    
    if(artistData.galleries[gallery].images[image].type == 'video'){
        document.getElementById('main-image-scroll-container').outerHTML = '<iframe width="100%" height="100%" src="' + artistData.galleries[gallery].images[image].embed + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';

        $('#loader').css('display', 'none');
        $('#main-image-container').css('display', 'block');
        $('#gallery-container').css('display', 'inline-block');
        $('#footer').css('display', 'block');
        
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
}

function preloadFrontData(){
    if(sessionStorage.frontData && sessionStorage.frontDataExpire){
        var frontDataExpire = new Date(sessionStorage.frontDataExpire);
        var now = new Date();
        
        if(Math.abs(frontDataExpire - now) / 1000 / 60 > 120){
            $.get('/data/front-data.json', frontData => {
                sessionStorage.frontData = JSON.stringify(frontData);
                sessionStorage.frontDataExpire = new Date();
            });
        }
    } else {
        $.get('/data/front-data.json', frontData => {
            sessionStorage.frontData = JSON.stringify(frontData);
            sessionStorage.frontDataExpire = new Date();
        });
    }
}

if(artist){
    if (typeof(Storage) !== "undefined") {
        
        if(sessionStorage.artistData && sessionStorage.artistDataExpire){
            
            var artistDataExpire = new Date(sessionStorage.artistDataExpire);
            var now = new Date();
            
            if(Math.abs(artistDataExpire - now) / 1000 / 60 < 120){
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
    window.location = '/404.html';
}

function collapseImage(){
    $('#overlay').css('display', 'none');
    $('#image-zoom-container').css('display', 'none');
    $('#page-container').css('filter', 'none');
    $('body').css('height', '100%').css('overflow', 'scroll');
    $('#overlay-close').css('display', 'none');
}
function expandImage(){
    
    $('#overlay').css('display', 'block');
    $('#image-zoom-container').css('display', 'block');
    $('#page-container').css('filter', 'blur(4px)');
    $('body').css('height', '100%').css('overflow', 'hidden');
    $('#overlay-close').css('display', 'block');
    
    if(deviceType == 'mobile'){
        statementPadding = statementMobilePadding;
    }
    
    if($('#main-image-padding-container').height() > $('#image-zoom-container').height() - statementPadding){
        $('#image-zoom-box').css('height', '100%');
    } else {
        $('#image-zoom-box').css('margin-top', ($('#image-zoom-container').height() - $('#main-image-padding-container').height()) / 2);
    }
    
    $(document).mouseup(function(e) {
        var container = $('#image-zoom-box');
        if (!container.is(e.target) && container.has(e.target).length == 0){
            collapseImage();
        }
    });
}