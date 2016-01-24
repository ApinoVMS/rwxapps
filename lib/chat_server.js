var fs = require('fs');
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

var matchesToFind=["item1","item2","tag"];
var crosslinkedFiles={};
var crosslinkTable={};
var clfJson="./public/json/crosslinkedFiles.json";

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    joinRoom(socket, 'Lobby');
    drawCrosslinkTable(socket);
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.manager.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  console.log("chat_server.assignGuestName/cs.aGN: emit('nameResult', name: "+name);
  console.log("cs.aGN: loading "+name+".json");
  socket.emit('nameResult', {  success: true,  name: name });
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  console.log("chat_server.joinRoom/cs.jR: emit('joinResult', room: "+room);
  
  socket.emit('joinResult', {room: room});
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

  var usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += ', ';
        }
        usersInRoomSummary += nickNames[userSocketId];
        console.log("cs.jR: comparing: "+nickNames[socket.id]+" needs2 "+nickNames[userSocketId]);
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') == 0) {
      console.log("chat_server.handleNameChangeAttempts/cs.hNCA: checking existance of json/"+name+".json");
      console.log("cs.hNCA 2 chat_ui.socket.on('nameResult'... $('#messages').append(divSystemContentElement(message));");
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];

        console.log("cs.hNCA 2 chat_ui.socket.on('nameResult'... $('#messages').append(divSystemContentElement({ success: true,  name: name }));");
        console.log("cs.hNCA looping through needs of everyone and broadcasting targetedmessages");
      

          // for (var index in usersInRoom) {
          //       var userSocketId = usersInRoom[index].id;
          //       if (userSocketId != socket.id) {
          //         if (index > 0) {
          //           usersInRoomSummary += ', ';
          //         }
          //         usersInRoomSummary += nickNames[userSocketId];
          //         console.log("cs.jR: comparing: "+nickNames[socket.id]+" needs2 "+nickNames[userSocketId]);
          //       }
          //     }


        socket.emit('nameResult', { success: true,  name: name });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });
}


var _getAllFilesFromFolder = function(dir) {

    var filesystem = require("fs");
    var results = [];

    filesystem.readdirSync(dir).forEach(function(file) {

        file = dir+'/'+file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(_getAllFilesFromFolder(file))
        } else results.push(file);

    });

    return results;

};

function handleDirectoryReading(socket) {
  socket.on('readDir', function(wrap) {
    var dir = wrap.message;
    console.log("handleDirectoryReading: "+dir);

    var results = _getAllFilesFromFolder(dir);

    socket.emit('readDirResult', { success: true,  dir: dir, results: results });
  });
}



function mapCrossLinkedFiles(filename, content){
  if (crosslinkedFiles.length==0) {
    var cl;
    var jsonFiles = _getAllFilesFromFolder("/public/json/crosslinks");    
    for (var i = 0; i < jsonFiles.length; i++) {

                console.log("mapCrossLinkedFiles, reading "+jsonFiles[i]);
                var filename=jsonFiles[i];
                fs.readFile(jsonFiles[i], function(err, content) {
                    if (err) { console.log("mapCrossLinkedFiles: fs.readFile err.code="+err.code); }
                    else{
                          content+="";
                          try {
                            cl=JSON.parse(content);
                            //{"item1":"NLP","item2":"CharismaBook","tagsCSV":"NLPStatement","note":"Add CharismaBook 2 NLP statements","mmX":"WIT","mmY":"UOLIT"},
                            //{"item1":"NLP","item2":"CharismaBook","tagsCSV":"NLPStatement","note":"Charisma is Power2Help X Willingness2Help","mmX":"WIT","mmY":"UOLIT"}
                            for (var item in cl){
                              if (item == "tagsCSV"){
                                var tags = item.split(",");
                                for (var t=0; t<tags.length; t++ ){
                                  tags[t].trim();
                                  if(!crosslinkedFiles.tags[tags[t]]){
                                    crosslinkedFiles.tags[tags[t]]=[];
                                  }  
                                  crosslinkedFiles.tags[tags[t]].push(filename); 
                                }
                              }else if (item == "note"){
                                console.log("note: "+cl[item]);
                              }else{
                                if (!crosslinkedFiles[item][cl[item]]) {
                                  crosslinkedFiles[item][cl[item]]=[];
                                }
                                crosslinkedFiles[item][cl[item]].push(filename);
                              }
                              
                            }
                          }catch(e){
                            console.log("mapCrossLinkedFiles: JSON.parse(content) err.code="+e);
                            console.log(content);
                          }

                      }                      
                  });

            } //for (var i = 0; i < jsonFiles.length; i++)
            console.log("mapCrossLinkedFiles is initialized");
            console.log(JSON.stringify(crosslinkedFiles));


      if (!filename || !content){
        console.log("mapCrossLinkedFiles - initialized only ");
        return;
      }else{
        cl=JSON.parse(content);
      }
  }
}//mapCrossLinkedFiles(filename, content)

writeJson = function(outFile, jsonData, callback) {
    fs.writeFile(outFile, jsonData, function(err) {
      if (err) return callback(err);
      callback(null, jsonData);
    });
};

function handleMessageBroadcasting(socket) {
  socket.on('message', function (wrap) {
    var outFile="./public/json/crosslinks/"+wrap.message.item1+"-X-"+wrap.message.item2+"_"+wrap.message.mmX+"-"+wrap.message.mmY+".json";
    console.log("chat_server.handleMessageBroadcasting cs.hmb: checking crosslinkedFiles is loaded");
    console.log("cs.hmb: alt name:"+wrap.message.mmX+"_"+wrap.message.item1+"-"+wrap.message.mmY+"_"+wrap.message.item2+".json");
    if (crosslinkedFiles.length>0){
      console.log("s.hmb: checking crosslinkedFiles is loaded");   
    }else{
      console.log("cs.hmb: reading crosslinkedFiles");   
      //var clfJson="./public/json/crosslinkedFiles.json";
      fs.readFile(clfJson, function(err, clfNamesRaw) {
        if (err) {
          console.log("err.code="+err.code);          
        }else{
          try{
            var clfNames = JSON.parse(clfNamesRaw);
            for (var i = 0; i < clfNames.length; i++) {

                console.log("reading "+clfNames[i]);
                var filename=clfNames[i];
                fs.readFile(clfNames[i], function(err, content) {
                    if (err) { console.log("err.code="+err.code); }
                    else{
                      var match = null;
                      var arrChunks=[]; 
                      var chBefore="", chAfter="";
                      var searchableItems=['yyy','xxx','ccc'];
                      //var searchableItems=['item1','item2','tags'];
                      for (var item in wrap.message) {
                        if (searchableItems.indexOf(item)>-1){
                          content+="";
                          //item=wrap.message[item]
                          //+"\\w+"
                          mapCrossLinkedFiles(filename, content);
                          console.log("matching "+item+"="+wrap.message[item]+" in "+filename);
                          var re = new RegExp(wrap.message[item], "g");
                          

                          if(match = content.match(re)){ //wrap.message[item]
                            console.log("Found "+wrap.message[item]+" in "+filename);

                            arrChunks=content.split(re);
                            var iChunk=0;
                            match.forEach(function(elem) {
                              if (arrChunks.length>iChunk){
                                  console.log("socket.emit(match, {"+filename+", chunkBefore="+arrChunks[iChunk].length+", chunkAfter="+arrChunks[iChunk+1].length);
                                  if (arrChunks[iChunk].length>50) chBefore=arrChunks[iChunk].substring(arrChunks[iChunk].length-40,arrChunks[iChunk].length);
                                  else chBefore=arrChunks[iChunk];

                                  if (arrChunks[iChunk+1].length>50) chAfter=arrChunks[iChunk+1].substring(1,40);
                                  else chAfter=arrChunks[iChunk+1];
                                  console.log("\n*********"+chBefore+"\n"+elem+"\n"+chAfter+"*******\n");

                                  iChunk++;
                                  socket.emit('match', {item: item, filename: filename, chBefore: chBefore, chAfter: chAfter, elem: elem});
                              } else {
                                  console.log("ERROR: arrChunks="+arrChunks+", but iChunk="+iChunk);
                              }
                            });
                          }else{
                            console.log(wrap.message[item]+" not found in "+filename+", content.length="+content.length);
                          }
                        }
                      }
                      //add another event to attach results 2 different div
                      //socket.emit('message', {text: usersInRoomSummary});
                    }                      
                  });

            };
            //console.log("cs.hmb: crosslinkedFiles\n:"+clfNamesRaw);
          }catch(e){
            console.log("cs.hmb: Error parsing "+clfJson+"\n:"+clfNamesRaw+"\n"+e);
          }
        }
          
      });
    }  
    console.log("cs.hmb: checking if "+outFile+" exists");    
    if (true){//fs.stat(outFile)){
      
      fs.readFile(outFile, function(err, textData) {
        if (err) {
          console.log("err.code="+err.code);
          writeJson(outFile, JSON.stringify(wrap.message), function(err) {
            if (err) {
              console.log("writeJson: "+err);
              return;
            }
            console.log("created "+wrap.message);
            console.log(wrap.message);

          });

        }else{
          console.log("cs.hmb: file exists");
          textData+=",\n"+JSON.stringify(wrap.message);
          writeJson(outFile, textData, function(err) {
            if (err) {
              console.log(err);
              return;
            }
            console.log(textData);

          });
          console.log("cs.hmb: updating writeJson("+outFile+", length="+textData.length+", callback); ");
        }
        // fs.writeFile(outFile, jsonData, function(err) {
        //   if (err) return callback(err);
        //   callback(null, jsonData);
        // });
      });
    }else{
      var writeOut = JSON.stringify(wrap.message); 
      console.log("cs.hmb: creating writeJson("+outFile+", length="+writeOut.length+"); ");
      
      //writeJson(outFile, writeOut);
      fs.writeFile(outFile, writeOut, function(err, result) {
          if (err) {
            console.log(err);
            return false;
          }
          console.log("JSON file created!\n" + outFile);
          console.log(writeOut);
          return true;

      });
    }




    
      //{ room: room, message: message };
      // message.item1  = $('#item1').val();
      // message.item2  = $('#item2').val();
      // message.tagsCSV   = $('#tags').val();
      // message.note  = $('#send-message').val();

    socket.broadcast.to(wrap.message.room).emit('message', wrap.message);
  });
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}
function drawCrosslinkTable(socket){

    var jsonFiles = [];
    var results = {};
    var crosslinkedFiles={};
    crosslinkedFiles.tags={};
    var drawingTable={};
    var drawingTableRows=[];

    var dir="./public/json/crosslinks";
    fs.readdirSync(dir).forEach(function(file) {
        var stat = fs.statSync(dir+'/'+file);
        jsonFiles.push(file);
    });

    console.log(jsonFiles);

       
    for (var i = 0; i < jsonFiles.length; i++) {
          var cl;
                console.log("mapCrossLinkedFiles, reading "+jsonFiles[i]);
                var filename=jsonFiles[i];
                content=fs.readFileSync(dir+'/'+jsonFiles[i], "utf-8");
                content+="";
                
                try {
                    var clarr = JSON.parse(content);
                    results[filename]=clarr;
                    console.log("PARSED "+filename);
                    for (var l = 0; l < clarr.length; l++) {
                        var cl=clarr[l];
                        var tags=[];
                        if (cl["tagsCSV"]){ 

                          if (cl["tagsCSV"].indexOf(",")){
                            tags = cl["tagsCSV"].split(",");
                            for (var t=0; t<tags.length; t++ ){
                              tags[t].trim();
                              if(!crosslinkedFiles.tags[tags[t]]){
                                crosslinkedFiles.tags[tags[t]]=[];
                              } 
                              crosslinkedFiles.tags[tags[t]].push(filename);
                              if (drawingTableRows.indexOf("_"+tags[t])==-1) drawingTableRows.push("_"+tags[t]);
                              
                            }
                          }else{
                            tags.push(cl["tagsCSV"].trim());
                          }
                        }
                            
    //********* OUTER LOOP ****** 
                        for (var item in cl){
                              console.log("Processing cl["+item+"]="+cl[item]);
                              try{
                                  if (item == "note"){
                                    console.log(item+"="+cl[item]);
                                  } else if(item == "tagsCSV" && tags){
                                    for (var ta = 0; ta < tags.length; ta++) {
                                      
                                      for (var citem in cl){ 
                                        
                                          if (citem == "note" || citem == "tagsCSV" ){
                                            console.log("\t TA: skpping "+citem+"="+cl[citem]);
                                          } else{  
                                              try{ 
                                                  console.log("TAGS OPTION: drawingTable[_"+tags[ta]+"]["+[cl[citem]]+"]=");
                                                  if (drawingTable["_"+tags[ta]]) {
                                                    if (drawingTable["_"+tags[ta]][cl[citem]]) {
                                                      if (drawingTable["_"+tags[ta]][cl[citem]].contains(filename)) {
                                                        console.log("TAG HAS ALREADY BEEN CROSSLINKED.");
                                                      } else {
                                                        drawingTable["_"+tags[ta]][cl[citem]].push(filename); 
                                                      }
                                                    }else{
                                                      drawingTable["_"+tags[ta]][cl[citem]]=[];
                                                      drawingTable["_"+tags[ta]][cl[citem]].push(filename); 
                                                    }
                                                  }else{
                                                    drawingTable["_"+tags[ta]]={};
                                                    drawingTable["_"+tags[ta]][cl[citem]]=[];
                                                    drawingTable["_"+tags[ta]][cl[citem]].push(filename); 

                                                  }
                                                  console.log("TAGS SUCCESS: "+drawingTable["_"+tags[ta]][cl[citem]]);
                                              } catch (err){

                                                      console.log("TAGS NEW OPTION: drawingTable[_"+tags[ta]+"]["+[cl[citem]]+"]=");
                                                      if(!drawingTable["_"+tags[ta]]) drawingTable["_"+tags[ta]]={};
                                                      drawingTable["_"+tags[ta]][cl[citem]]=[];
                                                      drawingTable["_"+tags[ta]][cl[citem]].push(filename);
                                                      
                                                      console.log("TAGS SUCCESS: "+drawingTable["_"+tags[ta]][cl[citem]]);
                                              }
                                          }
                                        } //for (var citem in cl)

                                      }//for (var ta = 0; ta < tags.length; ta++)  
                                    
                                  } //=============//if(item=="tagsCSV" && tags) else===================
                                  else{
                                    //if (!crosslinkedFiles[item]){ crosslinkedFiles[item]={}; } 
                                    if (!crosslinkedFiles[cl[item]]) {
                                      crosslinkedFiles[cl[item]]=[];
                                    }
                                    crosslinkedFiles[cl[item]].push(filename);

                                    
                                    if (item=="item1" || item=="item2" ){  
                                      console.log("Skipping "+item+"="+cl[item]);
                                    }else{ 
                                      if (drawingTableRows.indexOf(cl[item])==-1) drawingTableRows.push(cl[item]);
    //********* INNER LOOP ****** 
                                      for (var citem in cl){ 
                                        if (citem!=item){
                                          if (citem == "note" || citem == "tagsCSV"){
                                            console.log("\t IL: skpping "+citem+"="+cl[citem]);
                                          } else{  
                                              try{ 
                                                  console.log("OPTION: drawingTable["+cl[item]+"]["+[cl[citem]]+"]=");
                                                  drawingTable[cl[item]][cl[citem]].push(filename); 
                                                  
                                                  console.log(drawingTable[cl[item]][cl[citem]]);
                                              }  catch (err) {
                                                    try{ 
                                                      console.log("REVERSE OPTION: drawingTable["+[cl[citem]]+"]["+[cl[item]]+"]=");
                                                      if (drawingTable[cl[citem]][cl[citem]]) {
                                                        if (drawingTable[cl[citem]][cl[citem]].contains(filename)) {
                                                          console.log("ITEM HAS ALREADY BEEN CROSSLINKED.");
                                                        } else {
                                                          drawingTable[cl[citem]][cl[citem]].push(filename); 
                                                        }
                                                      }else{
                                                        drawingTable[cl[item]][cl[citem]]=[];
                                                        drawingTable[cl[item]][cl[citem]].push(filename);
                                                      }
                                                      console.log(drawingTable[cl[citem]][cl[item]]);

                                                    } catch (rerr){

                                                      console.log("RERR - NEW OPTION: drawingTable["+cl[item]+"]["+[cl[citem]]+"]=");
                                                      if(!drawingTable[cl[item]]) drawingTable[cl[item]]={};
                                                      drawingTable[cl[item]][cl[citem]]=[];
                                                      drawingTable[cl[item]][cl[citem]].push(filename);
                                                      
                                                      console.log(drawingTable[cl[item]][cl[citem]]);
                                                    }
                                                }

                                              }//if(item=="tagsCSV" && tags) else
                                            }//if not (citem=="item1" || citem=="item2"){
                                            
                                          }//if (citem!=item){
                                        }//for (var citem in cl)
                                    }//not item1 or item2

                              }catch(lineErr){
                                console.log("lineErr="+lineErr);
                                console.log("cl="+JSON.stringify(cl));
                              }
                            }//for (var item in cl){
                    }//for (var l = 0; l < clarr.length; l++)
                }catch(e){
                  console.log("ERROR JSON.parse(content): "+filename+ " : e.code="+e);
                  console.log(content);
                }

            } //for (var i = 0; i < jsonFiles.length; i++)

            socket.emit('drawingtable', { success: true,  headers: drawingTableRows, drawingTable: drawingTable });

            console.log(JSON.stringify(results));
            console.log("\n\nmapCrossLinkedFiles is initialized: crosslinkedFiles{}=");
            console.log(JSON.stringify(crosslinkedFiles));

            console.log("\n\ndrawingTableRows="+drawingTableRows);

            
            for (var x = 0; x < drawingTableRows.length; x++) {
              for (var y = 0; y < drawingTableRows.length; y++) {
                //console.log("drawingTable["+drawingTableRows[x]+"]["+drawingTableRows[y]+"]=");
                  try{
                    if (drawingTable[drawingTableRows[x]][drawingTableRows[y]]){
                       console.log("\ndrawingTable[x="+x+", "+drawingTableRows[x]+"][y="+y+", "+drawingTableRows[y]+"]=");
                       console.log(drawingTable[drawingTableRows[x]][drawingTableRows[y]]);
                    }
                   
                  }catch(err){
                    //console.log("NA");
                  }
              }
            }
}//drawCrosslinkTable(socket)  
