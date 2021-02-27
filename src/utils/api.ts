import fetch from 'node-fetch';

export default function api(path: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  return fetch(`http://localhost:9000${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(res => res.data)
}

export function get(path: string) {
  return api(path);
}

export function post(path: string, body: any) {
  return api(path, 'POST', body);
}