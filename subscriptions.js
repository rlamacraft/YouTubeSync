const main = async () => {
  const rawRss = await fetch('https://zapier.com/engine/rss/2087631/WatchTogether3/').then(data => data.text());
  const xmlDoc = new DOMParser().parseFromString(rawRss,"text/xml");
  const items = xmlDoc.getElementsByTagName('item');
  const rows = [...items].map(item => {
	const title = item.getElementsByTagName('title')[0].innerHTML;
	const link = item.getElementsByTagName('link')[0].innerHTML;
	const id = /.*watch\?v=(.*)/.exec(link)[1];
	return `<option value="${id}">${title}</option>`;
    });
    const select = document.getElementById('video-selector');
    select.innerHTML += rows.join('\n');
};

const onSelect = evt => {
  const id = evt.options[evt.selectedIndex].value;
  if(id !== "Choose") {
    sendMessage(id);
  }
};

main();
