// 로컬피드 앱스 스크립트 웹 앱 주소. 배포 후 받은 주소로 바꾼다. 비밀값이 아니다.
window.LOCALFEED_API = 'https://script.google.com/macros/s/AKfycbzgymkpZ2pMoH7dLO2OzKADd9VBPcYizQKFhBe8psPqF3YFqKVhM0HMbUzzij3V756g/exec';

window.lfApi = function (body) {
  return fetch(window.LOCALFEED_API, {
    method: 'POST',
    body: JSON.stringify(body)
  }).then(function (r) { return r.json(); });
};
