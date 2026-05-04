# GitHub Actions secrets (EC2 deploy)

The workflow **`.github/workflows/node-cicd.yml`** deploys on push to **`main`** using **appleboy/ssh-action**. Add these **Repository secrets** (Settings → Secrets and variables → Actions → New repository secret).

## Required secrets

| Secret name | Example / notes |
|-------------|------------------|
| **`EC2_HOST`** | Public IPv4 or DNS of the server (e.g. `ec2-xx-xx-xx-xx.compute.amazonaws.com`). |
| **`EC2_USER`** | SSH login (often `ubuntu`, `ec2-user`, or `admin` depending on AMI). |
| **`EC2_KEY`** | **Full** private key contents (PEM), including `-----BEGIN ... PRIVATE KEY-----` lines. |
| **`PORT`** | `8000` (must match Traefik `loadbalancer.server.port` in `docker-compose.yml`). |
| **`NODE_ENV`** | `production` |
| **`JWT_SECRET`** | Long random string (do not reuse across projects). |
| **`JWT_EXPIRES_IN`** | `1h` (or `7d`, etc.). |
| **`ALLOWED_ORIGINS`** | Comma-separated browser origins allowed by CORS. For your API host use at least: `https://api.udithsandaruwan.com` (add more if you have a separate web app origin). |
| **`DATABASE_URL`** | Neon (or Postgres) URL, including `?sslmode=require` if your provider needs it. |
| **`APP_DOMAIN`** | Hostname Traefik/Let’s Encrypt will use (no `https://`). Example: `api.udithsandaruwan.com`. |
| **`LETSENCRYPT_EMAIL`** | Real email for ACME account / expiry notices. **Must not contain** tricks that break YAML; plain address is fine. |

## What the workflow writes on EC2

On the server it runs (conceptually):

1. `cd ~/tuk-tuk-api` then `git pull origin main`
2. Writes **`~/tuk-tuk-api/.env.docker`** with `PORT`, `NODE_ENV`, `JWT_*`, `ALLOWED_ORIGINS`, `DATABASE_URL`, **`TRUST_PROXY=true`**, and if `APP_DOMAIN` is set also **`PUBLIC_BASE_URL=https://<APP_DOMAIN>`**
3. Exports **`APP_DOMAIN`** and **`LETSENCRYPT_EMAIL`** for Compose substitution
4. Runs **`docker compose --profile traefik up -d --build --remove-orphans`**

So **Traefik/Let’s Encrypt** get `APP_DOMAIN` and `LETSENCRYPT_EMAIL` from the **GitHub Actions environment** at deploy time (no separate `.env` file on the server is required for those two, as long as the exports stay in the same shell as `docker compose`).

## EC2 machine prerequisites (not GitHub secrets)

- Repo cloned at **`~/tuk-tuk-api`** on first setup (`git clone ...`).
- **Docker** and **Docker Compose plugin** installed.
- User in **`docker`** group (or deploy user can run `docker` without sudo).
- **Ports 80 / 443** open in the cloud security group (for Traefik + Let’s Encrypt HTTP-01).
- DNS **A** record for `APP_DOMAIN` → server public IP.

## Optional checks

- **`ALLOWED_ORIGINS`** must include your real HTTPS API origin or browsers will block cross-origin calls.
- If you change the deploy path from `~/tuk-tuk-api`, update the workflow `cd` line to match.
