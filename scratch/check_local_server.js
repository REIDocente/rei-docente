const http = require('http');

function checkUrl(urlPath) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: data.length, preview: data.substring(0, 300) });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function run() {
  console.log('Testing localhost:3000 routes...');
  const root = await checkUrl('/');
  console.log('GET /:', root);
  const evalRoute = await checkUrl('/evaluador');
  console.log('GET /evaluador:', evalRoute);
}

run();
