const requestURL = ' https://ease-ln.github.io/test/data.json';
const request = new Request(requestURL);

const response = await fetch(request);
const data = await response.json();