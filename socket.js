module.exports = function (io, rooms) {
  io.sockets.on("connection", (socket) => {
    socket.on("broadcaster", (room, user) => {
      rooms.push({
        broadcaster: socket.id,
        room: room,
        user: user,
      });

      socket.join(room);
      socket.broadcast.emit("broadcaster");
    });

    socket.on("watcher", (room) => {
      var broadcast = rooms.filter((r) => r.room === room)[0];

      socket.join(room);
      socket.to(broadcast.broadcaster).emit("watcher", socket.id);
    });

    socket.on("disconnect", () => {
      var room = rooms.filter((r) => r.room === room)[0];

      if (room) {
        socket.to(room.broadcaster).emit("disconnectPeer", socket.id);
      }
    });

    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
    });

    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message);
    });

    socket.on("candidate", (id, message) => {
      socket.to(id).emit("candidate", socket.id, message);
    });

    socket.on("message-sent", (room, message, user) => {
      var broadcast = rooms.filter((r) => r.room === room)[0];
      io.to(broadcast.room).emit("message-received", user, message);
    });

    socket.on("end", (room) => {
      var broadcast = rooms.filter((r) => r.room === room)[0];
      rooms.splice(broadcast, 1);

      io.to(room).emit("end-broadcast");
    });
  });
};
