var Chat = function(socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function(room, message) {
  var wrap = { room: room, message: message };
  this.socket.emit('message', wrap);
};

Chat.prototype.changeRoom = function(room) {
  this.socket.emit('join', { newRoom: room });
};

Chat.prototype.readDir = function(room, dir) {
  this.socket.emit('readDir', { room: room, dir: dir });
};

Chat.prototype.processCommand = function(command) {
  var commando, words;
  // readDir
  if (command.charAt(1) == '/') {
    commando= 'readDir';
    words= command.substring(2);
  } else { 
    words = command.split(' ');
    commando = words[0].substring(1, words[0].length).toLowerCase();
  }
  var message = false;

  switch(commando) {
    case 'readDir':
      this.readDir(room, words);
      break;
    case 'join':
      words.shift();
      var room = words.join(' ');
      this.changeRoom(room);
      break;
    case 'nick':
      words.shift();
      var name = words.join(' ');
      this.socket.emit('nameAttempt', name);
      break;
    default:
      message = 'Unrecognized command.';
      break;
  };

  return message;
};
