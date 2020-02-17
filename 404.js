var deviceType = 'desktop';
var maxMobileWidth = 370;

if(window.innerWidth < 1050){
    $('#title-container').css('margin-top', '8px');
}
if(window.innerWidth < 900){
    $('#title-container').css('margin-top', '3px');
}
if(window.innerWidth < 700){
    deviceType = 'mobile';

    $('#title-container').css('margin-left', '4%').css('margin-top', '0');
    $('#title').css('margin-left', '4%');
    $('#search-failed').css('margin-left', '25px');
    
    $('#page-container').css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');
    if(window.innerWidth < 395){
        $('#page-container').css('margin-top', '0px');
    }
    
    $('#home-button').css('margin-right', '10px').css('margin-left', '10%');
    $('#home-button-container').css('margin-bottom', '30px').css('top', '10px');
    
    $('#search-failed').css('margin-left', '4%').css('margin-top', '20px');
}

$.get('/data/redirect-data.json', data => {
    var findNewLocation = data[window.location.pathname];
    
    if(findNewLocation){
        if(findNewLocation.split('--')[0] == 'image'){
            window.location = 'https://drive.google.com/file/d/' + findNewLocation.split('--')[1] + '/view'
        }
        if(findNewLocation.split('--')[0] == 'page'){
            window.location = '/image?a=' + findNewLocation.split('--')[1].split('-')[0] + '&g=' + findNewLocation.split('--')[1].split('-')[1] + '&i=' + findNewLocation.split('--')[1].split('-')[2];
        }
    }
});