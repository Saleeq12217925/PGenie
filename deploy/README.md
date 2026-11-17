# Free PGenie deployment

This setup runs React, Express/Socket.io, and the Python AI service together on
one **Render Free web service**. MongoDB Atlas Free stores application data and
uploaded photos. Render supplies an HTTPS `onrender.com` address; no domain
purchase is needed.

## Accounts and deployment

1. Create a [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register).
   Create a **Free** cluster (formerly M0), preferably in Singapore. Do not choose
   Flex or a dedicated paid tier. Create a database user with `readWrite` access
   to a new `pgenie` database and a unique password. Copy the Drivers connection
   string, include `/pgenie` before the query string, and URL-encode any special
   characters in the username/password.
2. Push the deployment files and the application changes you want to publish to
   your GitHub repository. The root `render.yaml` must be in the selected branch.
   Do not commit credentials, `docker-data`, or virtual environments. The old
   Compose files contain development keys: this deployment does not use them.
3. In [Render](https://dashboard.render.com/), choose **New → Blueprint** and
   connect the GitHub repository and branch. Render reads `render.yaml`.
   Confirm that the single web service has the **Free** plan and no paid disk.
4. Supply the two prompted secrets:
   - `MONGO_URI`: the Atlas connection string for the new database.
   - `AES_KEY`: a new 64-character hexadecimal key. Generate it locally with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
     Keep it stable across redeploys: it encrypts users' authenticator secrets.
   Render generates `JWT_SECRET` and `REFRESH_SECRET` automatically.
5. On the Render service's **Connect → Outbound** panel, copy its outbound IP
   ranges into Atlas **Network Access**. Prefer these ranges over allowing the
   entire internet. If the initial build starts before this is ready, add the
   ranges and redeploy after the database connection fails.
6. Open the service's HTTPS URL. `/api/health` should return `{"status":"ok"}`.
   Register an owner and tenant, create a listing, upload a photo, refresh the
   browser to check the login session, and try a rent prediction and booking chat.
   Redeploy once and check that the uploaded photo remains available.

`CLIENT_URL` defaults to Render's assigned HTTPS URL. If you later attach a custom
domain, explicitly set `CLIENT_URL` to its HTTPS origin. `TRUST_PROXY=1` assumes
Render is the only proxy immediately in front of this directly exposed service.

The deployment starts with an empty cloud database. It does not copy your local
users, bookings, or photos. Do not run `seed.js` or `resetDB.js` on a database with
data you want to keep. Existing encrypted MFA data requires its original AES key
if you deliberately migrate that data later.

## What runs

- `deploy/Dockerfile` builds the frontend, installs the backend and Python
  dependencies, and trains the synthetic rent model during the build.
- `deploy/start.py` runs Gunicorn on loopback and Node on Render's public port.
  If either process exits, the container exits so the host can restart it.
- Express serves the SPA, `/api`, `/uploads`, and Socket.io at the same origin.
- `PHOTO_STORAGE=mongodb` stores each photo in a separate MongoDB document.
  The existing 5 MB per-file and five-photos-per-listing limits still apply.
  Local development keeps filesystem storage unless this setting is enabled.
- The image excludes `.env` files, local databases, uploaded files, and caches.
  Production secrets are supplied at runtime, not embedded in the image.

## Free-tier limits

- Render sleeps after 15 minutes of inactivity; waking up can take about a minute.
  Its 750 free instance hours per workspace per month are shared with any other
  free services in that workspace. Builds and bandwidth also have limits.
- Atlas Free has 512 MB of database storage, shared by photos, indexes, and all
  other records. Use small photos for a demo and monitor storage usage.
- This is intended for a demo or small hobby project. It has limited memory and
  CPU, no always-on guarantee, and no persistent Render disk. Payments in PGenie
  are simulated; deployment does not turn them into real payment processing.

## Local production verification

Build with `docker build -f deploy/Dockerfile -t pgenie-free:local .`.
Supply a separate test MongoDB database and fresh secrets at runtime. Set
`CLIENT_URL=http://localhost:5180`, `PHOTO_STORAGE=mongodb`, and `PORT=10000`,
then map `127.0.0.1:5180:10000`. Do not reuse a real cloud database for the smoke
test: it intentionally creates an owner, a listing, and a photo.

Run `node deploy/smoke-test.mjs http://127.0.0.1:5180`. Browser authentication
must be verified on HTTPS because production refresh cookies are Secure.

## References

- [Render free limits](https://render.com/docs/free)
- [Render Blueprints](https://render.com/docs/blueprint-spec)
- [Render outbound IP ranges](https://render.com/docs/outbound-ip-addresses)
- [Atlas Free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
