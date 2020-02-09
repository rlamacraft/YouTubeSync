const main = async () => {
    const rawRss = await fetch('https://zapier.com/engine/rss/2087631/WatchTogether3/').then(data => data.text());
    const xmlDoc = new DOMParser().parseFromString(rawRss,"text/xml");
    const items = xmlDoc.getElementsByTagName('item');
    const rows = [...items].map(item => {
	const title = item.getElementsByTagName('title')[0].innerHTML;
	const link = item.getElementsByTagName('link')[0].innerHTML;
	const id = /.*watch\?v=(.*)/.exec(link)[1];
	return `<button class="video" data-id="${id}">${title}</button>`;
    });
    document.getElementById('box_subscriptions').innerHTML += rows.join('\n');
    [...document.getElementsByClassName('video')].map(btn => {
	btn.addEventListener('click', evt => {
	    actions.proposeEvent('load', {
                url: `https://www.youtube.com/watch?v=${evt.target.getAttribute('data-id')}`
            })
	})			    
    });
}

main();
