const https = require('https');
https.get('https://anilibria.top/api/v1/anime/releases/2001', res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const ep1 = data.episodes.find(e => e.episodes.includes(1));
    console.log(ep1.hls_720);
  });
});
