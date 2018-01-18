"use strict";

const audio = new Audio();

let tracks = [];
let playing;

const setPlaying = track => {
  playing = track;
  audio.src = `http://music.163.com/song/media/outer/url?id=${playing.id}.mp3`;
};

const update = async () => {
  const response = await fetch("http://music.163.com/api/radio/get", {
    credentials: "include"
  });
  const json = await response.json();
  return json.data;
};

const next = async () => {
  const track = tracks.shift();
  if (tracks.length === 0) {
    update().then(data => {
      tracks = data;
    });
  }
  return track || (await next());
};

audio.addEventListener("ended", () => {
  next().then(track => {
    setPlaying(track);
    audio.play();
  });
});

audio.addEventListener("loadedmetadata", () => {
  chrome.runtime.sendMessage({
    type: "playing_info",
    data: playing
  });
  chrome.runtime.sendMessage({
    type: "playing_state",
    data: playing_state()
  });
  chrome.runtime.sendMessage({
    type: "next_playing_info",
    data: tracks[0]
  });
});

// init
update().then(data => {
  tracks = data;
  next().then(track => setPlaying(track));
});

const playing_state = () => ({
  currentTime: audio.currentTime,
  playing_or_paused: audio.paused ? "paused" : "playing"
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "get": {
      switch (request.data) {
        case "playing_info":
          sendResponse(playing);
          break;
        case "playing_state":
          sendResponse(playing_state());
          break;
      }
      break;
    }
    case "task": {
      switch (request.data) {
        case "toggle_play":
          if (audio.paused) {
            audio.play();
          } else {
            audio.pause();
          }
          sendResponse(playing_state());
          break;

        case "pause":
          audio.pause();
          sendResponse(playing_state());
          break;

        case "next":
          let track = next().then(track => {
            setPlaying(track);
            audio.play();
          });

          break;
      }
      break;
    }
  }
});
