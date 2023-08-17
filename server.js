const fs = require("fs");
const https = require("https");
const express = require("express");
const app = express();
const socketio = require("socket.io");
app.set("view engine", "ejs");
app.use(express.static(__dirname));

const certificate = {
  key: fs.readFileSync("cert.key"),
  cert: fs.readFileSync("cert.crt"),
};

app.get("/", (req, res) => {
  var userName;
  // console.log("IP ADDRESS: ", req.socket.remoteAddress);
  if (req.socket.remoteAddress == "::ffff:192.168.1.57") {
    userName = "Rahma-" + Math.floor(Math.random() * 10000);
  } else if (req.socket.remoteAddress == "::ffff:192.168.1.197") {
    userName = "Noor-" + Math.floor(Math.random() * 10000);
  } else if (req.socket.remoteAddress == "::ffff:192.168.1.174") {
    userName = "Noors Phone -" + Math.floor(Math.random() * 10000);
  }

  res.render("home", { userName: userName });
});

const expressServer = https.createServer(certificate, app);
const io = socketio(expressServer);

const socketsStatus = {};

// {
//   microphone: false,
//   mute: false,
//   username: "user-" + Math.floor(Math.random() * 999999),
//   online: true,
//   socketId: null,
//   selectedSocketIds: [],
// };


io.on("connection", socket => {
  const socketId = socket.id;
  const userStatus = {
    microphone: false,
    username: "Room #" + Math.floor(Math.random() * 999999),
    online: true,
    socketId: null,
    selectedSocketIds: [],
  };

  socketsStatus[socketId] = userStatus;
  socketsStatus[socketId].socketId = socketId;
  io.sockets.emit("usersUpdate", socketsStatus, socketId);

  socket.on("voice", (data, currentUserSocketId) => {
    var newData = data.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];
    socketsStatus[currentUserSocketId].selectedSocketIds.forEach(id => {
      if (id != currentUserSocketId && socketsStatus[id].online) {
        socket.broadcast.to(id).emit("send", newData);
      }
    });
  });

  socket.on("toggleMic", (currentSocketId, newMicStatus) => {
    socketsStatus[currentSocketId].microphone = newMicStatus;
    io.emit("feToggleMic", socketsStatus, currentSocketId);
  });

  socket.on("changeUsername", (currentUserSocketId, newUsername) => {
    socketsStatus[currentUserSocketId].username = newUsername;
    io.emit("usersUpdate", socketsStatus, currentUserSocketId);
  });

  socket.on("toggleOnlineStatus", (currentUserSocketId, newOnlineStatus) => {
    socketsStatus[currentUserSocketId].online = newOnlineStatus;
    io.emit("usersUpdate", socketsStatus, currentUserSocketId);
  });

  socket.on("toggleSelect", (currSocketId, userId) => {
    if (userId === currSocketId) {
      return;
    } else if (
      socketsStatus[currSocketId].selectedSocketIds.find(id => {
        return id == userId;
      })
    ) {
      socketsStatus[currSocketId].selectedSocketIds = socketsStatus[
        socketId
      ].selectedSocketIds.filter(id => {
        id !== userId;
      });

      return;
    } else {
      socketsStatus[currSocketId].selectedSocketIds.push(userId);
      return;
    }
  });

  socket.on("disconnect", () => {
    delete socketsStatus[socketId];
    // io.emit("usersUpdate", socketsStatus, socketId);
  });
});

expressServer.listen(8080);
