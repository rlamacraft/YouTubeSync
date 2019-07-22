const convertISO8601ToMinutes = input => {
    const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
    const toNum = n => n ? Number(n) : 0;
    const roundUp = n => n + 1;
    if (regex.test(input)) {
        const [_whole, hours, mins, ..._rest] = regex.exec(input);
        return roundUp(toNum(hours) * 60  + toNum(mins));
    } else {
        throw new Error("Invalid input.");
    }
}

const encodeQueryParams = params => {
	const [_extraAmp, ...str] = Object.keys(params).reduce((acc, k) => `${acc}&${k}=${params[k]}`, "");
	return str.join('');
};
	
const myFetch = async (baseUrl, params) => fetch(`${baseUrl}?${encodeQueryParams(params)}`).then(data => data.json());
	
const youtubeFetch = async (resource, params) => {
	return myFetch(`https://www.googleapis.com/youtube/v3/${resource}`, {
		...params,
		key: "AIzaSyDC5sa5suWHrefNDXtAuZswRgzcSnnnsIA"
	});
};

const uploadsId = async (id) => {
	return (await youtubeFetch("channels", {
		part: "contentDetails",
		id
	})).items[0].contentDetails.relatedPlaylists.uploads;
};

const headPlaylist = async (playlistId) => {
	return (await youtubeFetch("playlistItems", {
		part: "contentDetails",
		playlistId
	})).items.map(v => v.contentDetails.videoId);
};

const fetchVideosMetadata = async (id) => {
	return (await youtubeFetch("videos", {
		part: "snippet,contentDetails",
		id
	})).items.map(v => ({
		id: v.id,
		title: v.snippet.title,
		channel: v.snippet.channelTitle,
        duration: convertISO8601ToMinutes(v.contentDetails.duration),
        publishedAt: v.snippet.publishedAt
	}));
};

/**
 * Used for populating array below
 */
const getChannelId = async (channels) => {
	return (await youtubeFetch("channels", {
		part: "id",
		forUsername: channels
	})).items.map(x => x.id);
};

const channelIds = [
    "UC54SLBnD5k5U3Q6N__UjbAw", // Chinese Cooking Demystified
    "UCPzFLpOblZEaIx2lpym1l1A", // French Guy Cooking
    "UCfyehHM_eo4g5JUyWmms2LA", // SORTED
    "UCekQr9znsk2vWxBo3YiLq2w", // You Suck At Cooking
    "UC9TM3Lrth8MQjHrttZJZiEw", // Adam Liaw
    "UCcjhYlL1WRBjKaJsMH_h7Lg", // Epicurious
    "UCQBG3PzyQKY8ieMG2gDAyOQ", // Peaceful Cuisine
    "UCF_fEX51a8LTXmMeJbPAPjw"  // Food Busker
    "UC3XTzVzaHQEd30rQbuvCtTQ"  // Last Week Tonight
];

const recentUploads = async () => {
	return (await Promise.all(channelIds.map(async id => {
		const uploadsPlaylist = await uploadsId(id);
		const head = await headPlaylist(uploadsPlaylist);
		return head;
	}))).flat();
};

const renderNewVideos = (videoData) => {
    videoData.sort((a,b) => {
        if (a.publishedAt < b.publishedAt) {
            return 1;
        } else if(a.publishedAt > b.publishedAt) {
            return -1;
        } else {
            return 0;
        }
    }).map(video => {
        const box = document.createElement('div');
        box.classList = "sub-box";
        const heading = document.createElement('h3');
        heading.innerText = video.title;
        box.appendChild(heading);
        const subheading = document.createElement('div');
        subheading.classList = 'sub-box_subheading';
        const channelSubheading = document.createElement('h4');
        if (video.channel === "Alex") {
            channelSubheading.innerText = "French Guy Cooking";
        } else {
            channelSubheading.innerText = video.channel;
        }
        subheading.appendChild(channelSubheading);
        const duration = document.createElement('h4');
        duration.innerText = `${video.duration} mins`;
        subheading.appendChild(duration);
        box.appendChild(subheading);
        document.getElementById('box_subscriptions').appendChild(box);
        box.addEventListener('click', () => {
            actions.proposeEvent('load', {
                url: `https://www.youtube.com/watch?v=${video.id}`
            })
        });
    });
};
	
const main = async () => {
	try {
		renderNewVideos(await fetchVideosMetadata(await recentUploads()));
	} catch(err) {
		console.error(err);
	}
};

main();
