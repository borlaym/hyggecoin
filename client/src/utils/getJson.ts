const ROOT = 'http://hyggecoin.herokuapp.com';

export default function getJson<T>(path: string): Promise<T> {
  return fetch(ROOT + path, {
    mode: 'cors',
    credentials: 'omit'
  })
    .then(response => response.json())
    .then(response => (response.data))
    .catch(err => console.error(err));
}