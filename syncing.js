const setup = (cb) => {

  const ws = new WebSocket('wss://l1efvbptcc.execute-api.us-east-1.amazonaws.com/dev');
  ws.onopen = () => {
    console.log("connection established");
  };

  function sendMessage(data) {
    const msg = JSON.stringify({
      action: 'sendMessage',
      data: JSON.stringify(data)
    });
    return ws.send(msg);
  }
  function now() {
    return new Date().getTime();
  }

  const accept = (data) => {
    sendMessage({
      ...data,
      type: 'acceptance'
    });

    setTimeout(() => {
      cb(data);
    }, data.time - now())
  }

  const reject = (data) => {
    sendMessage({
      ...data,
      type: 'rejection'
    });
  }

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    const log = `${data.event} @ ${data.time}`;

    // return acceptance of proposal
    if(data.type === 'proposal') {
      try {
        console.log('current state on proposal', player.getPlayerState());
        if(data.event === "load") {
          accept(data);
        } else if(data.event === "play") {
          if(player.getPlayerState() === YT.PlayerState.CUED
          || player.getPlayerState() === YT.PlayerState.PAUSED
          || player.getPlayerState() === YT.PlayerState.UNSTARTED) {
            accept(data);
          } else {
            reject(data);
          }
        } else if(data.event === "pause") {
          if(player.getPlayerState() === YT.PlayerState.PLAYING
          || player.getPlayerState() === YT.PlayerState.BUFFERING) {
            accept(data);
          } else {
            reject(data);
          }
        } else {
          reject(data);
        }
      } catch(_error) {
        reject(data);
      }
    }

    // schedule action
    if(data.type === 'acceptance') {
      setTimeout(() => {
        cb(data);
      }, data.time - now())
    }

    if(data.type === "rejection") {
      console.error(`cannot do '${data.event}' at this time`);
    }
  };

  function close() {
    ws.close();
  }

  function proposeEvent(event, params) {
    sendMessage({
      type: 'proposal',
      event: event,
      time: `${now() + 500}`,
      thread: 1, // will just increment
      params: params
    });
    // console.log(`Requested #1`);
  }

  ws.onclose = (evt) => {
      actions = setupWithCallback();
  };

  return {
    "proposeEvent": proposeEvent,
    "closeEvent": close
  }
}

function setupWithCallback() {
    const prepareErrorMessageInCaseVideoFailsToPlay = (video_id) => {
	document.getElementById('messageLogBody').innerText = `Error loading video. Check correct URL, videoId is '${video_id}'`;
	document.getElementById('messageLog').hidden = true;
    }
    
    return setup((data) => {
	const eventMap = {
	    "play": () => {
		console.log('proposing playing');
		const time = data.params.time;
		player.seekTo(time, true);
		setTimeout(() => {
		    player.playVideo();
		}, 100);
	    },
	    "pause": () => {
		console.log('proposing pausing');
		player.pauseVideo();
	    },
	    "load": () => {
		const video_id = getVideoId(data.params.url);
		prepareErrorMessageInCaseVideoFailsToPlay(video_id);
		console.log(`setting video: id='${video_id}'`);
		player.loadVideoByUrl({mediaContentUrl: `http://www.youtube.com/v/${video_id}?version=3`});
		document.getElementById("url-loader").value = data.params.url;
	    }
	};

	eventMap[data.event]();
    });
}

var actions = setupWithCallback();

const onPlayerStateChange = () => {
  const state = player.getPlayerState();

  console.log('state change', state);
}

const onError = (event) => {   
    console.error("Failed to load player", event);
    document.getElementById('messageLog').hidden = false;
}

function getVideoId(url) {
    if(/https\:\/\/youtu\.be\/(.*)/.test(url)) {
	return url.match(/https\:\/\/youtu\.be\/(.*)/)[1];
    } else if(/v=(.*)/.test(url)) {
	return url.match(/v=(.*)/)[1]; // TODO: This doesn't work if there are any additional params
    } else {
	alert("Invalid URL");
	throw new Error("Invalid URL");
    }
}

document.getElementById("url-loader").addEventListener("keyup", e => {
    if(e.keyCode === 13) {
      actions.proposeEvent('load', {
        url: e.target.value
      })
    }
});

document.getElementById("play").addEventListener("click", e => {
    actions.proposeEvent("play", {
	time: player.getCurrentTime() // TODO: get current time of player
    });
});

document.getElementById("pause").addEventListener("click", e => {
    actions.proposeEvent("pause");
});


