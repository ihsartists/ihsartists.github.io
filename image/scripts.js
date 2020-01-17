var deviceType = 'desktop';
if(window.innerWidth < 1050){
    $('#title-container').css('margin-top', '8px');
}
if(window.innerWidth < 900){
    $('#title-container').css('margin-top', '3px');
}
if(window.innerWidth < 700){
    deviceType = 'mobile';
    
    $('#title').css('font-size', '25px');

    $('#title-container').css('margin-left', 'calc(4% + 4px)').css('margin-top', '0')
    $('#title-container').css('width', 'calc(100% - 120px)');
    
    $('#home-button').css('margin-right', '4%').css('margin-left', '4%');
    $('#home-button-container').css('position', 'absolute').css('right', 'calc(2% + 4px)').css('top', '25px').css('margin', '0');
    
    $('#main-image-padding-container').css('max-width', 'calc(100% - 18px)');
    $('#main-image-container').css('width', 'calc(100% - 18px)').css('text-align', 'center').css('margin-left', '8px').css('margin-right', '8px').css('margin-top', '10px');
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

function loadPage(data){
    var artistData = JSON.parse(data.split("'").join("%39"));
        console.log(artistData);
        
        $('#title').text(artistData.name.split("%39").join("'"));
        $('title').text(artistData.name.split("%39").join("'"));
        
        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?a=' + artist + '&g=' + gallery + '&i=' + image + '&t=' + artistData.name.replace("'", "\\'");
            window.history.pushState({path:newurl},'',newurl);
        }
        
        if(artistData.galleries[gallery].images[image].type == 'image'){
            $('#main-image').attr('src', '/images/image--' + artist + '-' + gallery + '-' + image + '.jpg').on('load', () => {
                
                $('#loader').css('display', 'none');
                $('#main-image-container').css('display', 'block');

                if(deviceType == 'mobile'){

                    aspectRatio = $('#main-image').width() / $('#main-image').height();

                    if(aspectRatio > 2){
                        $('#main-image').css('height', '240px');
                    } else if(aspectRatio > 1.5){
                        $('#main-image').css('height', '265px');
                    } else if(aspectRatio > 1){
                        $('#main-image').css('height', '290px');
                    } else if(aspectRatio > 0.75){
                        $('#main-image').css('height', '305px');
                    } else if(aspectRatio > 0.5){
                        $('#main-image').css('height', '330px');
                    } else {
                        $('#main-image').css('height', '340px');
                    }
                }
            });
        }
        if(artistData.galleries[gallery].images[image].type == 'video'){
            document.getElementById('main-image-scroll-container').outerHTML = '<iframe width="100%" height="300" src="' + artistData.galleries[gallery].images[image].embed + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
            
            $('#loader').css('display', 'none');
            $('#main-image-container').css('display', 'block');
            
            if(deviceType == 'mobile'){
                $('#main-image-padding-container').css('max-width', 'width', 'calc(100% - 18px)');
                $('#main-image-padding-container').width('100%');
            } else {
                $('#main-image-padding-container').width('50%');
            }
        }
}

if(artist){
    if (typeof(Storage) !== "undefined") {
        if(sessionStorage['artist-' + artist]){
            loadPage(sessionStorage['artist-' + artist]);
        } else {
            $.get('https://script.google.com/macros/s/AKfycbx1mPuNWZr6IMmiWw2SRfMxfchkWVHH2j6C9MZjz3TWlEuyzk8/exec?a=' + artist, data => {
                loadPage(data);
                sessionStorage['artist-' + artist] = data;
            });
        }
    } else {
        $.get('https://script.google.com/macros/s/AKfycbx1mPuNWZr6IMmiWw2SRfMxfchkWVHH2j6C9MZjz3TWlEuyzk8/exec?a=' + artist, data => {
            loadPage(data);
        });
    }
} else {
    window.location = '/';
}