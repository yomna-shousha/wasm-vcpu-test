import http from 'k6/http';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  const url = __ENV.TARGET;
  http.get(url);
}

