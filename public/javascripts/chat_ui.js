/** var drawingTableRows= message.headers; 
    var drawingtable= message.drawingtable;*/
function buildGrid(drawingTableRows, drawingtable) {

  var tableMarkup = "";
  var anlDiv="";
  var scoreCard={};
  var linkFiles=[];
  var span="";
  var xTh="";
  console.log("drawingTableRows "+drawingTableRows.length);
  for (var y = 0; y < drawingTableRows.length+1; y++) {
    tableMarkup += "<tr>";
    if (y==0){
      tableMarkup+= "<td></td>"
      for (var x = 0; x < drawingTableRows.length; x++) {

          var arr = drawingTableRows[x].split('');
          for (var ch = 0; ch < arr.length; ch++) {
            xTh+=arr[ch];
            if (ch%4==0) xTh+=" ";
          };
          console.log("arr="+arr.length+", xTh="+xTh);
          tableMarkup+= "<td>"+xTh+"</td>";
          xTh="";
          scoreCard[drawingTableRows[x]]=0;

      }
    }else{
      for (x = 0; x < drawingTableRows.length+1; x++) {
        if (x==0){
          tableMarkup+="<td id=\""+drawingTableRows[y-1]+"\">"+drawingTableRows[y-1]+"</td>";
          
        }else{
          tableMarkup+= "<td>";
          if (drawingtable[drawingTableRows[x-1]]){
            if (drawingtable[drawingTableRows[x-1]][drawingTableRows[y-1]]){
              span=" data-toggle=\"popover\" data-trigger=\"hover\" data-html=\"true\" title=\"...\" data-content=\""; 
              
              linkFiles=drawingtable[drawingTableRows[x-1]][drawingTableRows[y-1]];
              for (var i = 0; i < linkFiles.length; i++) {
                span+=linkFiles[i]+"<br/>";
              }
              span+="\"";
              scoreCard[drawingTableRows[y-1]]+=linkFiles.length;              
              span="<span "+span+">"+linkFiles.length+"</span>";
              
              tableMarkup+=span;
            }
          }
          tableMarkup+= "</td>"  
        }
      }
    }
    tableMarkup += "</tr>"; 
    //console.log(tableMarkup);
  } 

  $("#drawing-table").html(tableMarkup);
  for (var row in scoreCard){
    console.log(row+"="+scoreCard[row]);

    $("#"+row).css({"font-size": ""+(scoreCard[row]+2)/3+"em"});
  }
  

};


function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  var message ={};
  message.item1  = $('#item1').val();
  message.item2  = $('#item2').val();
  message.tagsCSV   = $('#tags').val();
  message.note  = $('#send-message').val();
  message.mmX  = $('#mmX').val();
  message.mmY  = $('#mmY').val();
  message.search  = $('#search').val();

  var systemMessage;

  if (message.note.charAt(0) == '/') {

    systemMessage = chatApp.processCommand(message.note);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('#room').text(), message);
    console.log("$('#messages').append(divEscapedContentElement("+message.note+"));");
    $('#messages').append(divEscapedContentElement(message.note+" mmX="+message.mmX+", mmY="+message.mmY));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
  var chatApp = new Chat(socket);
  socket.on('readDirResult', function(result) {
    var message;
    if (result.success) { message = 'Found ' + result.results.length + ' in '+ result.dir;} 
    else {  message = result.message; }
    $('#messages').append(divSystemContentElement(message)); 
  });

  socket.on('match', function (message) {
    //socket.emit('match', {item: item, filename: filename, chBefore: chBefore, chAfter: chAfter, elem: elem});
    
    var newElement = $('<div></div>').text(message.elem+" in "+message.filename+": chBefore="+message.chBefore.length+"chAfter="+message.chAfter.length);
    //if(message.item=="item1")
    console.log('#'+message.item+'.append('+message.elem+" in "+message.filename+": chBefore="+message.chBefore.length+"chAfter="+message.chAfter.length+")");
    //$('#'+message.item).append(newElement);
    $('#messages').append(newElement);
  });

  socket.on('nameResult', function(result) {
    var message;
    if (result.success) { message = 'You are now known as ' + result.name + '.';} 
    else {  message = result.message; }
    $('#messages').append(divSystemContentElement(message)); 
  });

  socket.on('joinResult', function(result) {
    $('#room').text(result.room);
    $('#messages').append(divSystemContentElement('Room changed.'));
  });

  socket.on('message', function (message) {
    var newElement = $('<div></div>').text(message.text);
    $('#messages').append(newElement);
  });

  socket.on('drawingtable', function (message) {
    var drawingTableRows= message.headers; 
    var drawingTable= message.drawingTable;
    var metadata="";
    for (var x = 0; x < drawingTableRows.length; x++) {
      metadata+=drawingTableRows[x]+", ";
    }
    var newElement = $('<div></div>').text("CrossLink table has "+drawingTableRows.length+" rows: "+metadata);
    $('#tableheaders').append(newElement);

    buildGrid(drawingTableRows, drawingTable);
  });

  socket.on('rooms', function(rooms) {
    $('#room-list').empty();

    for(var room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
