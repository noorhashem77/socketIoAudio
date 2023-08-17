const usernameInput = document.getElementById("username");
const usernameLabel = document.getElementById("username-label");
const usernameDiv = document.getElementById("username-div");
const usersDiv = document.getElementById("users");

usernameInput.value = "";
usernameLabel.innerText = "";
var userStatus = {};
var socketId = -1;

window.onload = e => {
  mainFunction(1000);
};

const socket = io.connect("https://192.168.1.197:8080");

function mainFunction(time) {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    var madiaRecorder = new MediaRecorder(stream);
    madiaRecorder.start();

    var audioChunks = [];

    madiaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    madiaRecorder.addEventListener("stop", () => {
      var audioBlob = new Blob(audioChunks);

      audioChunks = [];

      var fileReader = new FileReader();
      fileReader.readAsDataURL(audioBlob);
      fileReader.onloadend = function () {
        if (!userStatus.microphone || !userStatus.online) return;

        var base64String = fileReader.result;
        socket.emit("voice", base64String, socketId);
      };

      madiaRecorder.start();

      setTimeout(() => {
        madiaRecorder.stop();
      }, time);
    });

    setTimeout(() => {
      madiaRecorder.stop();
    }, time);
  });

  socket.on("send", data => {
    var audio = new Audio(data);
    audio.play();
  });

  // Create the component
  const createComponent = user => {
    const componentContainer = document.getElementById("rooms");

    const mainDiv = document.createElement("div");
    mainDiv.classList.add("col", "mb-4");

    const card = document.createElement("div");
    card.classList.add("card");

    const cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    const roomName = document.createElement("h5");
    roomName.classList.add("card-title", "m-5");
    roomName.innerHTML = user.username;
    roomName.textContent = user.username;

    const selecUserCheckBox = document.createElement("input");
    selecUserCheckBox.classList.add("form-check-input", "mt-0", "top-left");
    selecUserCheckBox.type = "checkbox";
    selecUserCheckBox.value = "";
    selecUserCheckBox.id = user.socketId;

    // the online offline circle indicators
    const onlineStatus = document.createElement("div");
    onlineStatus.classList.add("colored-circle", "small-circle");
    user.online
      ? onlineStatus.classList.add("bg-success")
      : onlineStatus.classList.add("bg-danger");

    // the online offline button
    userStatus.online
      ? (document.querySelector("#online").innerHTML = "Go Offline")
      : (document.querySelector("#online").innerHTML = "Go Online");

    document.querySelector("#online").classList = [];
    userStatus.online
      ? document
          .querySelector("#online")
          .classList.add("btn", "btn-sm", "btn-outline-danger", "m-1")
      : document
          .querySelector("#online")
          .classList.add("btn", "btn-sm", "btn-outline-success", "m-1");

    userStatus.microphone
      ? (document.querySelector("#toggleMic").innerHTML = "Close Microphone")
      : (document.querySelector("#toggleMic").innerHTML = "Open Microphone");
    userStatus.microphone
      ? console.log("Micccc is on")
      : console.log("miccc is off");

    mainDiv.appendChild(card);
    card.appendChild(cardBody);
    cardBody.appendChild(roomName);
    cardBody.appendChild(onlineStatus);

    if (user.socketId !== socketId && user.online) {
      cardBody.appendChild(selecUserCheckBox);
    }
    componentContainer.appendChild(mainDiv);
  };

  const addEventListnerOnCheckBox = data => {
    for (user in data) {
      if (user !== socketId) {
        const checkbox = document.querySelector(
          `input[type="checkbox"][id="${user}"]`
        );

        if (checkbox) {
          checkbox.addEventListener("change", toggleSelectUser);
        }
      }
    }
  };

  socket.on("feToggleMic", (data, currentUserSocketId) => {
    data[currentUserSocketId].microphone
      ? (document.querySelector("#toggleMic").innerHTML = "Close Microphone")
      : (document.querySelector("#toggleMic").innerHTML = "Open Microphone");
    data[currentUserSocketId].microphone
      ? console.log("Micccc is on")
      : console.log("miccc is off");
  });

  socket.on("usersUpdate", (data, currentUserSocketId) => {
    if (socketId === -1) {
      userStatus = data[currentUserSocketId];
      socketId = currentUserSocketId;
      usernameInput.value = data[currentUserSocketId].username;
      usernameLabel.innerText = data[currentUserSocketId].username;
    }
    const usersDiv = document.querySelector("#rooms");
    usersDiv.innerHTML = "";
    for (const key in data) {
      if (!Object.hasOwnProperty.call(data, key)) continue;
      createComponent(data[key], currentUserSocketId);
    }
    addEventListnerOnCheckBox(data, currentUserSocketId);
  });
}

const changeUsername = () => {
  socket.emit("changeUsername", socketId, usernameInput.value);
  userStatus.username = usernameInput.value;
  usernameLabel.innerText = userStatus.username;
  usernameDiv.style.display = "none";
  usernameLabel.style.display = "block";
};

const toggleConnection = e => {
  userStatus.online = !userStatus.online;
  socket.emit("toggleOnlineStatus", socketId, userStatus.online);
};

const toggleMicrophone = e => {
  userStatus.microphone = !userStatus.microphone;
  socket.emit("toggleMic", socketId, userStatus.microphone);
};

const toggleSelectUser = e => {
  console.log("Selecting user");
  const userId = String(e.target.id);
  socket.emit("toggleSelect", socketId, userId);
};

document
  .querySelector("#change_username")
  .addEventListener("click", changeUsername);
document
  .querySelector("#toggleMic")
  .addEventListener("click", toggleMicrophone);
document.querySelector("#online").addEventListener("click", toggleConnection);
usernameLabel.onclick = () => {
  usernameDiv.style.display = "block";
  usernameLabel.style.display = "none";
};
