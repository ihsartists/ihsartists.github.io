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

function resizeImage() {
    
    var naturalWidth = $('#main-image')[0].naturalWidth;
    var naturalHeight = $('#main-image')[0].naturalHeight;
    var containerWidth = $('#main-image-container').width();
   
    var scaleType = 'dynamic';
    if(naturalWidth > 596 && naturalWidth < 608){
        scaleType = 'width';
        if(naturalHeight > 457){
            scaleType = 'vertical-scroll';
        }
    } 
    else if(naturalHeight > 446 && naturalHeight < 458){
        scaleType = 'height';
        if(naturalWidth > 607){
            scaleType = 'horizontal-scroll';
        }
    }
    
    console.log(scaleType);
    
    if(deviceType == 'desktop'){
        containerWidth -= 350;
        
        if(scaleType == 'width'){
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
            
        }
        if(scaleType == 'height'){
            console.log(containerWidth * (naturalHeight / naturalWidth))
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
    }
    if(deviceType == 'mobile'){
        containerWidth -= 23;
        
        if(scaleType == 'width'){
            $('#main-image').css('width', containerWidth + 'px').css('max-width', '600px');
        }
        if(scaleType == 'height'){
            $('#main-image').css('height', '450px').css('max-width', containerWidth + 'px');
            if($('#main-image').width() == containerWidth){
                $('#main-image').css({height: ''});
            }
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
    }
}

$('#main-image').attr('src', '/images/image--' + artist + '-' + gallery + '-' + image + '.jpg').on('load', () => {
                
    $('#loader').css('display', 'none');
    $('#main-image-container').css('display', 'block');
    
    resizeImage();
});

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

                resizeImage();
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