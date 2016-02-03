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

  var systemMessage;

  if (message.note.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message.note);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('#room').text(), message);
    console.log("$('#messages').append(divEscapedContentElement("+message.note+"));");
    $('#messages').append(divEscapedContentElement(message.note));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }
  $('#send-message').val('');
}

var socket = io.connect();

$(document).ready(function() {
  var chatApp = new Chat(socket);
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
  


  socket.on('kStats', function(docs) {
    var kStats=$('#kStats')
    kStats.empty();

    for(var doc in docs) {
      //room = room.substring(1, room.length);
      if (doc != '') {
        $('#doc-list').append(divEscapedContentElement(doc));
      }
    }

    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  setInterval(function() { socket.emit('kStats'); }, 1000);

  $('#send-message').focus();

  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
