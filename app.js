"use strict";

const body = document.body;
const togglePlayButton = document.getElementById("toggle_play");
const nextButton = document.getElementById("next");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const album = document.getElementById("album");
const duration = document.getElementById("duration");
const currentTime = document.getElementById("currentTime");
const prefetch_image = document.getElementById("prefetch_image");

const time2string = time => {
  let _time = ~~time;
  const _ss = (_time % 60).toString().padStart(2, "0");
  if (_time < 60) {
    return "00:" + _ss;
  }
  _time = ~~(_time / 60);
  const _mm = (_time % 60).toString().padStart(2, "0");
  if (_time < 60) {
    return _mm + ":" + _ss;
  }
  _time = ~~(_time / 60);
  const _hh = _time.toString().padStart(2, "0");
  return [_hh, _mm, _ss].join(":");
};

const update_info = track => {
  body.style.backgroundImage = `url(${track.album.picUrl}?param=300y300)`;
  title.innerText = track.name;
  title.href = `http://music.163.com/song/${track.id}`;
  album.innerText = track.album.name;
  artist.innerText = track.artists.map(ar => ar.name).join(" / ");
  duration.innerText = time2string(track.duration / 1000);
};

const _state = { playing_or_paused: "paused", currentTime: 0 };

const appState = new Proxy(_state, {
  set(trapTarget, key, value, receiver) {
    update_state(key, value);
    return Reflect.set(trapTarget, key, value, receiver);
  }
});

let intervalHandler;

const update_state = (key, value) => {
  switch (key) {
    case "playing_or_paused":
      togglePlayButton.title = value;
      togglePlayButton.dataset.state = value;
      clearInterval(intervalHandler);
      if (value === "playing") {
        intervalHandler = setInterval(() => {
          appState.currentTime += 1;
        }, 1000);
      }
      break;
    case "currentTime":
      currentTime.innerText = time2string(value);
      break;
  }
};

togglePlayButton.addEventListener("click", () => {
  chrome.runtime.sendMessage(
    {
      type: "task",
      data: "toggle_play"
    },
    state => {
      Object.assign(appState, state);
    }
  );
});

nextButton.addEventListener("click", () => {
  nextButton.disabled = true;
  setTimeout(() => {
    nextButton.disabled = false;
  }, 2000);
  chrome.runtime.sendMessage(
    {
      type: "task",
      data: "next"
    },
    () => {
      get_state();
    }
  );
});

const get_info = () =>
  chrome.runtime.sendMessage(
    {
      type: "get",
      data: "playing_info"
    },
    track => {
      update_info(track);
    }
  );

const get_state = () =>
  chrome.runtime.sendMessage(
    {
      type: "get",
      data: "playing_state"
    },
    state => {
      Object.assign(appState, state);
    }
  );

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "playing_info":
      update_info(request.data);
      break;
    case "next_playing_info":
      prefetch_image.href = `${request.data.album.picUrl}?param=300y300`;
      break;
  }
});

get_info();
get_state();
