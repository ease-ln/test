  const requestURL = ' https://ease-ln.github.io/test/data.json';
  const request = new Request(requestURL);

  const response = await fetch(request);
  const superHeroes = await response.json();

  var json = JSON.stringify({ table : [] });
  var fs = require('fs');
  fs.writeFile('./data.json', json, 'utf8', callback);
