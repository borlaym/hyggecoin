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

export function post(path: string, body: any) {
  return fetch(ROOT + path, {
    method: 'POST',
    body: JSON.stringify(body),
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => res.data)
}