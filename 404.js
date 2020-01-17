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

$.get('/redirect-data.json', data => {
    //Change when goes live on ihsartists.net
    var findNewLocation = data['http://ihsartists.net/' + window.location.pathname];
    
    if(findNewLocation){
        console.log(findNewLocation);
    }
});