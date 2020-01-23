var deviceType = 'desktop';
if(window.innerWidth < 1050){
    $('#title-container').css('margin-top', '8px');
}
if(window.innerWidth < 900){
    $('#title-container').css('margin-top', '3px');
}
if(window.innerWidth < 700){
    deviceType = 'mobile';

    $('#title-container').css('margin-left', '4%').css('margin-top', '0');
    
    $('#home-button').css('margin-right', '4%').css('margin-left', '4%');
    $('#home-button-container').css('position', 'absolute').css('right', 'calc(2% + 4px)').css('top', '25px').css('margin', '0');
    
    $('#search-failed').css('margin-left', '4%').css('margin-top', '20px');
}

$.get('/data/redirect-data.json', data => {
    var findNewLocation = data['http://ihsartists.net' + window.location.pathname];
    
    if(findNewLocation){
        if(findNewLocation.split('--')[0] == 'image'){
            window.location = 'https://drive.google.com/file/d/' + findNewLocation.split('--')[1] + '/view'
        }
        if(findNewLocation.split('--')[0] == 'page'){
            window.location = '/image?a=' + findNewLocation.split('--')[1].split('-')[0] + '&g=' + findNewLocation.split('--')[1].split('-')[1] + '&i=' + findNewLocation.split('--')[1].split('-')[2];
        }
    }
});