/*! modernizr 3.0.0-alpha.3 (Custom Build) | MIT *
 * http://v3.modernizr.com/download/#-audio !*/
!function(e,n){function a(e,n){return typeof e===n}function o(){var e,n,o,s,i,r,l;for(var u in t){if(e=[],n=t[u],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(o=0;o<n.options.aliases.length;o++)e.push(n.options.aliases[o].toLowerCase());for(s=a(n.fn,"function")?n.fn():n.fn,i=0;i<e.length;i++)r=e[i],l=r.split("."),1===l.length?Modernizr[l[0]]=s:(!Modernizr[l[0]]||Modernizr[l[0]]instanceof Boolean||(Modernizr[l[0]]=new Boolean(Modernizr[l[0]])),Modernizr[l[0]][l[1]]=s),c.push((s?"":"no-")+l.join("-"))}}var t=[],s={_version:"3.0.0-alpha.3",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var a=this;setTimeout(function(){n(a[e])},0)},addTest:function(e,n,a){t.push({name:e,fn:n,options:a})},addAsyncTest:function(e){t.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=s,Modernizr=new Modernizr;var i=function(){return"function"!=typeof n.createElement?n.createElement(arguments[0]):n.createElement.apply(n,arguments)};Modernizr.addTest("audio",function(){var e=i("audio"),n=!1;try{(n=!!e.canPlayType)&&(n=new Boolean(n),n.ogg=e.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),n.mp3=e.canPlayType("audio/mpeg;").replace(/^no$/,""),n.opus=e.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),n.wav=e.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),n.m4a=(e.canPlayType("audio/x-m4a;")||e.canPlayType("audio/aac;")).replace(/^no$/,""))}catch(a){}return n});var c=[];o(),delete s.addTest,delete s.addAsyncTest;for(var r=0;r<Modernizr._q.length;r++)Modernizr._q[r]();e.Modernizr=Modernizr}(window,document);

(function() {
  var tracks = []

  tracks.push({
    id: 1
  , title: 'First track'
  , duration: 7
  })
  tracks.push({
    id: 2
  , title: 'Best track'
  , duration: 12
  })
  tracks.push({
    id: 3
  , title: 'New track'
  , duration: 23
  })

  var tracksContainer = document.getElementById('tracks')

  var i, row, cell1, cell2, cell3, cell4, button1, button1icon, button2, button2icon;
  for(i = 0; i < tracks.length; i++) {
    row = tracksContainer.insertRow(i)
    cell1 = row.insertCell(0)
    cell2 = row.insertCell(1)
    cell3 = row.insertCell(2)
    cell4 = row.insertCell(3)

    cell1.innerHTML = tracks[i].id
    cell2.innerHTML = tracks[i].title
    cell3.innerHTML = tracks[i].duration

    button1icon = document.createElement('SPAN')
    button1icon.className = 'glyphicon glyphicon-remove'
    button1 = document.createElement('BUTTON')
    button1.className = 'btn btn-xs btn-danger'
    button1.appendChild(button1icon)
    cell4.appendChild(button1)

    button2icon = document.createElement('SPAN')
    button2icon.className = 'glyphicon glyphicon-play'
    button2 = document.createElement('BUTTON')
    button2.className = 'btn btn-xs btn-primary'
    button2.appendChild(button2icon)
    cell4.appendChild(button2)
  }

  var playerTitle = document.getElementById('player-title')
    , playerProgress = document.getElementById('player-progress')
    , playerButtonPlay = document.getElementById('player-button-play')
    , playerState = {
        track: null
      , isPlaying: false
      , progress: 0
      , interval: null
      }

  function setPlayerProgress(floatValue){
    playerProgress.style.width = Math.round(floatValue * 10000)/100 + '%'
  }

  function playTrack(track){
    // Do nothing if it is the same track and player is already playing
    if (track === playerState.track && playerState.isPlaying) return false;

    // If same track, just play forward
    if (track !== playerState.track) {
      playerState.track = track
      playerTitle.innerHTML = track.title
      setPlayerProgress(0)
    }

    playerState.isPlaying = true

    setPlayerProgress(playerState.progress / playerState.track.duration)
    playerState.interval = setInterval(function(){
      playerState.progress += 0.5

      if (playerState.progress <= playerState.track.duration){
        setPlayerProgress(playerState.progress / playerState.track.duration)
      } else {
        clearInterval(playerState.interval)
        playerState.interval = null
        playerState.progress = 0

        playNextTrack()
      }
    }, 500)
  }

  function pauseTrack(){
    if (!playerState.isPlaying) return false;

    playerState.isPlaying = false
    clearInterval(playerState.interval)
    playerState.interval = null
  }

  function playNextTrack(){
    for (var i = 0; i < tracks.length; i++) {
      // Find current track
      if (tracks[i] === playerState.track) {
        // Check if next song is available
        if (i < tracks.length - 1) {
          playTrack(tracks[i + 1])
        }
        break;
      }
    }
  }

  playerButtonPlay.addEventListener('click', function(ev){
    ev.preventDefault()
    if (playerState.isPlaying) {
      pauseTrack()
    } else {
        if(Modernizr.audio.mp3){
    var snd = new Audio();
        snd.src = "sample.mp3";
        snd.play();
  }
      playTrack(playerState.track || tracks[0])
    }
  })
}())
