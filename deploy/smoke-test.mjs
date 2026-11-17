import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.argv[2] || 'http://127.0.0.1:5180';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) {
  throw new Error('Use an isolated local deployment database for this test.');
}
const request = (route, options) => fetch(`${base}${route}`, options);
const json = (body, token) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});

assert.equal((await request('/api/health')).status, 200);
const page = await request('/login');
assert.equal(page.status, 200);
assert.match(await page.text(), /<div id="root">/);
assert.equal((await request('/api/does-not-exist')).status, 404);
assert.equal((await request('/uploads/missing.png')).status, 404);

const email = `deploy-${randomUUID()}@example.com`;
const password = `Test-${randomUUID()}-A1`;
const signup = await request('/api/auth/register', json({ name: 'Deployment Test', email, password, role: 'owner' }));
assert.equal(signup.status, 201, await signup.clone().text());
const cookie = signup.headers.get('set-cookie');
assert.match(cookie, /HttpOnly/i);
assert.match(cookie, /Secure/i);
assert.match(cookie, /SameSite=Strict/i);
const { accessToken } = await signup.json();
assert.equal((await request('/api/auth/me', { headers: { Authorization: `Bearer ${accessToken}` } })).status, 200);
const refresh = await request('/api/auth/refresh', {
  method: 'POST', headers: { Cookie: cookie.split(';')[0] },
});
assert.equal(refresh.status, 200);

const listing = await request('/api/pgs', json({
  title: 'Deployment verification listing', description: 'Local test only',
  address: '123 Test Street', city: 'Bangalore', locality: 'Test',
  roomType: 'single', rent: 8000, deposit: 0, totalBeds: 2, amenities: ['wifi'],
}, accessToken));
assert.equal(listing.status, 201, await listing.clone().text());
const { data } = await listing.json();
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=', 'base64');
const form = new FormData();
form.append('photos', new Blob([png], { type: 'image/png' }), 'smoke.png');
const upload = await request(`/api/pgs/${data._id}/photos`, {
  method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form,
});
assert.equal(upload.status, 200, await upload.clone().text());
const { photos } = await upload.json();
const image = await request(`/uploads/${photos[0]}`);
assert.equal(image.status, 200);
assert.equal(image.headers.get('content-type'), 'image/png');
assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
const prediction = await request('/api/ai/predict-rent', json({ city: 'Bangalore', roomType: 'single', amenities: ['wifi'] }, accessToken));
assert.equal(prediction.status, 200, await prediction.clone().text());
assert.equal(typeof (await prediction.json()).predictedRent, 'number');

const engine = await request('/socket.io/?EIO=4&transport=polling');
assert.equal(engine.status, 200);
assert.match(await engine.text(), /^0\{"sid":/);

await new Promise((resolve, reject) => {
  const socket = new WebSocket(`${base.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`);
  const timeout = setTimeout(() => { socket.close(); reject(new Error('WebSocket auth timed out')); }, 5000);
  socket.addEventListener('error', () => { clearTimeout(timeout); reject(new Error('WebSocket connection failed')); });
  socket.addEventListener('message', ({ data: message }) => {
    if (message.startsWith('0')) socket.send(`40${JSON.stringify({ token: accessToken })}`);
    if (message.startsWith('40')) { clearTimeout(timeout); socket.close(); resolve(); }
    if (message.startsWith('44')) { clearTimeout(timeout); socket.close(); reject(new Error(message)); }
  });
});

// Confirm removal, then leave another photo for the restart-persistence check.
const removed = await request(`/api/pgs/${data._id}/photos/${photos[0]}`, {
  method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
});
assert.equal(removed.status, 200);
assert.equal((await request(`/uploads/${photos[0]}`)).status, 404);
const persisted = await request(`/api/pgs/${data._id}/photos`, {
  method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: form,
});
assert.equal(persisted.status, 200);
const result = await persisted.json();
console.log('PASS: health, SPA routes, API 404s, signup, session refresh, listings, photos, AI prediction, authenticated WebSocket, photo deletion.');
console.log(`Restart persistence check: ${base}/uploads/${result.photos[0]}`);
