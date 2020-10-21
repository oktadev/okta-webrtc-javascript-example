function viewer(room, data) {

  var user = JSON.parse(data);
  const socket = io.connect(window.location.origin);

  let peerConnection;
  const config = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  };

  const video = document.getElementById("remoteVideo");

  socket.on("offer", (id, description) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection
      .setRemoteDescription(description)
      .then(() => peerConnection.createAnswer())
      .then((sdp) => peerConnection.setLocalDescription(sdp))
      .then(() => {
        socket.emit("answer", id, peerConnection.localDescription);
      });
    peerConnection.ontrack = (event) => {
      video.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
      }
    };
  });

  socket.on("candidate", (id, candidate) => {
    peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .catch((e) => console.error(e));
  });

  socket.on("broadcaster", () => {
    socket.emit("watcher", room);
  });

  socket.on("disconnectPeer", () => {
    peerConnection.close();
  });

  socket.on("end-broadcast", () => {
    $("#broadcast").remove();
    $('#message').append('<h2>This stream has ended</h2>')
  });

  socket.on("message-received", (name, message) => {
    $("#chat-table tr:last").after(
      '<tr><td style="width:20%">' + name + "</td><td>" + message + "</td></tr>"
    );
  });

  $("#chat-button").on("click", function () {
    var message = $("#chat-message").val();
    socket.emit("message-sent", room, message, user.name);
    $("#chat-message").val("");
  });

  window.onunload = window.onbeforeunload = () => {
    socket.close();
  };

  socket.emit("watcher", room);
}
