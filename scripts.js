var deviceType = 'desktop';

var maxMobileWidth = 370;

function resizeWindow(){
    if(window.innerWidth < 1050){
        $('#title').css('margin-top', '30px');
    }
    if(window.innerWidth < 900){
        $('#title').css('margin-top', '25px');
    }
    if(window.innerWidth < 700){
        deviceType = 'mobile';
        $('#title').css('margin-left', '4%');
        $('#search-failed').css('margin-left', '25px');
        $('#search-input').css('margin-right', '10px').css('margin-left', '10px');
        $('#search-cancel').css('right', 'calc(4% + 10px)');
        $('#title').css('margin-top', '20px');
        
        $('#page-container').css('max-width', maxMobileWidth + 'px').css('margin-top', '5px');
        
        if(window.innerWidth < 395){
            $('#page-container').css('margin-top', '0px');
        }
    }
}
resizeWindow();

function loadPage(frontData){
    $('#loader').css('display', 'none');

    console.log(frontData);
    
    for(var i = Object.keys(frontData.years).length - 1; i > -1; i--){
        $('#page-container').append('<div class="year" id="year'+ i +'"><h2 class="year-name">'+ frontData.years[i].name +'</h2></div>');

        for(var j = 0; j < frontData.years[i][deviceType].length; j++){
            $('#year'+ i).append('<div onclick="window.location = \'image/?a='+ frontData.years[i][deviceType][j] +'&g='+ frontData[frontData.years[i][deviceType][j]].link[0] +'&i='+ frontData[frontData.years[i][deviceType][j]].link[1] +'&t='+ frontData[frontData.years[i][deviceType][j]].name.split("'").join("\\'") +'\'" class="artist"><img class="artist-thumb" src="/images/artist-thumb--' + frontData.years[i][deviceType][j] + '.jpg"><div class="artist-bottom"><p class="artist-name">'+ frontData[frontData.years[i][deviceType][j]].name +'</p></div></button>');
        }

        if(deviceType == 'mobile'){
            $('.artist').css('width', '31.33%').css('padding-top', '1.5%');
            $('.year-name').css('margin-left', '4%');
            $('.artist-name').css('font-size', '14px');
            $('.artist-bottom').css('height', '43px');
        }
    }
    $('#page-container').append("<div id='footer'><span id='footer-text'>© Copyright **YEAR**, All Rights Reserved<br><br>Website built and programmed by Josh Chang.<br><a href='mailto:joshchang04@gmail.com' class='footer-link'>Need help with a project of your own?</a></span></div>");
    
    var today = new Date();
    $('#footer').html($('#footer').html().split('**YEAR**').join(today.getFullYear().toString()));
    
    if(deviceType == 'mobile'){
        $('#footer').css('margin-top', '70px').css('margin-bottom', '40px').css('margin-left', '15px');
    }
}

function preloadArtistData(){
    if(sessionStorage.artistData){} else {
        $.get('/data/artist-data.json', artistData => {
            sessionStorage.artistData = JSON.stringify(artistData);
            sessionStorage.artistDataExpire = new Date();
        });
    }
}

if (typeof(Storage) !== "undefined") {
    if(sessionStorage.frontData){
        loadPage(JSON.parse(sessionStorage.frontData));
        preloadArtistData();
    } else {
        $.get('/data/front-data.json', frontData => {
            loadPage(frontData);
            sessionStorage.frontData = JSON.stringify(frontData);
            sessionStorage.frontDataExpire = new Date();
            preloadArtistData();
        });
    }
} else {
    $.get('/data/front-data.json', frontData => {
        loadPage(data);
    });
}

function expandSearch() {
    $('#search-input').removeClass('material-icons').attr('onclick', '').css('background', '#e0e0e0').attr('readOnly', false);
    if($('#search-input').val() == 'search'){
        $('#search-input').val('');
    }
    if(deviceType == 'mobile'){
        $('#search-input').css('width', 'calc(92% - 11px)');
    }
    if(deviceType == 'desktop'){
        $('#search-input').css('width', 'calc(96% - 11px)');
    }
}
function clearSearch() {
    $(".artist").show();
    $('.year-name').show();
    $('#search-failed').hide();
    $('#search-input').attr('onclick', '').attr('readOnly', false);
    $('#search-input').focus();
    $("#search-cancel").css('display', 'none');
    $('#search-box').css('margin-bottom', '0px');
    $('#search-input').val('');
}
$('#search-input').focusout(function() {
    if($('#search-input').val().length == 0 || $('#search-input').val() == 'search'){
        $('#search-input').addClass('material-icons').attr('onclick', 'expandSearch()').val('search').css('width', '50px').css('background', 'white').attr('readOnly', false);
    } else {
        $('#search-input').focus().attr('onclick', 'expandSearch()').attr('readOnly', true);
    }
});
$('#search-input').hover(function() {
    $('#search-input').css('background', '#e0e0e0');
});
$('#search-input').mouseout(function() {
    if($('#search-input').is(":focus") == false){
        $('#search-input').css('background', 'white');
    }
});

function boyerMooreSearch(text, pattern) {
    if (pattern.length === 0) {
        return 1;
    }
    let charTable = makeCharTable(pattern);
    let offsetTable = makeOffsetTable(pattern);

    for (let i = pattern.length - 1, j; i < text.length;) {
        for (j = pattern.length - 1; pattern[j] == text[i]; i--, j--) {
            if (j === 0) {
                return i;
            }
        }
        const charCode = text.charCodeAt(i);
        i+= Math.max(offsetTable[pattern.length - 1 - j], charTable[charCode]);
    }
    return -1;
}
function makeCharTable(pattern) {
    let table = [];
    for (let i = 0; i < 65536; i++) {
        table.push(pattern.length);
    }
    for (let i = 0; i < pattern.length - 1; i++) {
        const charCode = pattern.charCodeAt(i);
        table[charCode] = pattern.length - 1 - i;
    }
    return table;
}
function makeOffsetTable(pattern) {
    let table = [];
    table.length = pattern.length;
    let lastPrefixPosition = pattern.length;

    for (let i = pattern.length; i > 0; i--) {
        if (isPrefix(pattern, i)) {
            lastPrefixPosition = i;
        }
        table[pattern.length - i] = lastPrefixPosition - 1 + pattern.length;
    }
    for (let i = 0; i < pattern.length - 1; i++) {
        const slen = suffixLength(pattern, i);
        table[slen] = pattern.length - 1 - i + slen;
    }
    return table;
}
function isPrefix(pattern, p) {
    for (let i = p, j = 0; i < pattern.length; i++, j++) {
        if (pattern[i] != pattern[j]) {
            return false;
        }
        return true;
    }
}
function suffixLength(pattern, p) {
    let len = 0;
    for (let i = p, j = pattern.length - 1; i >= 0 && pattern[i] == pattern[j]; i--, j--) {
        len += 1;
    }
    return len;
}

$("#search-input").keyup(function () {
    if($(this).val()){
        $("#search-cancel").css('display', 'inline-block');
        $('#search-box').css('margin-bottom', '-21px');
    }
    else {
        $("#search-cancel").css('display', 'none');
        $('#search-box').css('margin-bottom', '0px');
    }
    var searchQuery = $(this).val().toLocaleLowerCase().trim();
    $(".artist").each(function() {
        if(boyerMooreSearch($(this).text().toLocaleLowerCase(), searchQuery) == -1){
            $(this).hide();
        } else {
            $(this).show();
        }
    });
    $(".year").each(function() {
        if($(this).children('.artist:visible').length == 0){
            $(this).children('.year-name').hide();
        } else {
            $(this).children('.year-name').show();
        }
    });
    if($('.year-name:visible').length == 0){
        $('#search-failed').show();
    } else {
        $('#search-failed').hide();
    }
});
$("button").click(function () {
   $("input").val('');
   $(this).hide();
});
