function broadcaster(data) {
  var socket = io();

  var user = JSON.parse(data);

  const peerConnections = {};
  const localVideo = document.getElementById("localVideo");

  const config = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  };

  navigator.getUserMedia(
    { video: true, audio: true },
    (stream) => {
      if (localVideo) {
        localVideo.srcObject = stream;
        socket.emit("broadcaster", user.sub, user.name);
      }
    },
    (error) => {
      $('#broadcast').remove();
      $('#message').append('<h3>We were unable to detect a webcam</h3>');
      console.warn(error.message);
    }
  );

  socket.on("watcher", (id) => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    let stream = localVideo.srcObject;
    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
      }
    };

    peerConnection
      .createOffer()
      .then((sdp) => peerConnection.setLocalDescription(sdp))
      .then(() => {
        socket.emit("offer", id, peerConnection.localDescription);
      });
  });

  socket.on("answer", (id, description) => {
    peerConnections[id].setRemoteDescription(description);
  });

  socket.on("candidate", (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
  });

  socket.on("message-received", (name, message) => {
    console.log(name, message);
    $("#chat-table tr:last").after(
      '<tr><td style="width:20%">' + name + "</td><td>" + message + "</td></tr>"
    );
  });

  socket.on("disconnectPeer", (id) => {
    peerConnections[id].close();
    delete peerConnections[id];
  });

  window.onunload = window.onbeforeunload = () => {
    socket.emit('end', user.sub)
    socket.close();
  };
}
