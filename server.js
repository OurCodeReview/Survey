const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
let users = [];

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/users", (_, res) => {
  res.send(users);
});

io.on("connection", (socket) => {
  socket.on("user-connected", (user) => {
    users.push({ ...user, socketId: socket.id });
    socket.broadcast.emit("users-changed", users);
    console.log("user-connected", users);
  });
  socket.on("new-chat-message", (message) => {
    const recipient = users.find((user) => user.id === message.recipient);
    const sender = users.find((user) => user.socketId === socket.id);
    console.log("new-chat-message", message, recipient, sender);
    socket.to(recipient.socketId).emit("new-chat-message", {
      message: message.text,
      sender,
    });
  });
  socket.on("disconnect", () => {
    const user = users.find((user) => user.socketId === socket.id);
    if (!user) {
      return;
    }

    const updatedUsers = users.filter(
      (userToFind) => userToFind.id !== user.id
    );
    users = updatedUsers;
    socket.broadcast.emit("users-changed", users);
    console.log("users-changed", user, users);
  });
});

server.listen(3000, () => {
  console.log("listening on 3000");
});
