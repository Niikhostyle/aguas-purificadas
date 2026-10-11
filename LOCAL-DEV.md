# Local development → VPS deploy (no builds on the VPS)

**Policy:** develop and `docker build` on your PC only. The VPS only loads a prebuilt image and swaps containers via `deploy-mibidon.sh`. Never run `docker build`, `npm run build`, or `next build` on the VPS.

This branch (`cursor/vps-sync-354f`) is a snapshot of `/var/www/mibidon` from the VPS (plus `deploy/deploy-mibidon.sh`), including demo-cuenta / middleware patches that were live on disk. It does **not** include `.env` secrets.

Known-good production image tags on the VPS: `mibidon-app:fix-origin-354f` and `mibidon-app:healthy-20261011` (same image id at snapshot time). See `VPS-SNAPSHOT.txt`.

## 1. Clone on your PC

```bash
git clone https://github.com/Niikhostyle/aguas-purificadas.git
cd aguas-purificadas
git fetch origin
git checkout cursor/vps-sync-354f
```

Optional: merge into your daily branch when ready:

```bash
git checkout main
git merge cursor/vps-sync-354f
# resolve conflicts if any, then push main
```

## 2. Run locally (npm + Postgres)

```bash
docker compose up -d          # Postgres on localhost:5432
cp .env.example .env          # fill secrets; never commit .env
npm install
npx prisma migrate deploy
npm run db:seed               # needs SEED_* in .env
npm run dev                   # http://127.0.0.1:43123/?tenant=demo
```

Demo storefront (no login): use host/`?tenant=demo` and `/cuenta` (redirects to `/cuenta/demo-access`).  
Demo admin (no login): `demo` host → `/admin/demo-access`.

## 3. Build the production image on your PC

Use the same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` as production `.env` (build-time salt for Server Actions).

```bash
# from repo root, with production key available in the environment
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY='…same as VPS .env…'

docker build \
  --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
  --build-arg NEXT_PUBLIC_WHATSAPP_NUMBER="${NEXT_PUBLIC_WHATSAPP_NUMBER:-56900000000}" \
  -t mibidon-app:local-$(date -u +%Y%m%d%H%M) \
  .
```

Save and copy to the VPS (SSH port **31772**):

```bash
TAG=local-$(date -u +%Y%m%d%H%M)
docker tag mibidon-app:$TAG mibidon-app:$TAG
docker save mibidon-app:$TAG | gzip > /tmp/mibidon-app-$TAG.tar.gz

scp -P 31772 /tmp/mibidon-app-$TAG.tar.gz root@45.7.229.146:/root/
scp -P 31772 deploy/deploy-mibidon.sh root@45.7.229.146:/root/deploy-mibidon.sh
```

## 4. Deploy on the VPS (load only — never build)

```bash
ssh -p 31772 root@45.7.229.146
# on VPS:
chmod +x /root/deploy-mibidon.sh
/root/deploy-mibidon.sh /root/mibidon-app-TAG.tar.gz TAG
# rollback if needed:
# /root/deploy-mibidon.sh --rollback
```

`deploy-mibidon.sh` runs `docker compose … up -d --no-build`, waits for health, and auto-rolls back on failure.

If you also changed **source** under `/var/www/mibidon` (not only the image), sync that tree separately (rsync/scp) **excluding** `.env`. Runtime secrets stay only on the VPS.

## 5. Emergency: restore known-good image (on VPS)

```bash
/root/deploy-mibidon.sh mibidon-app:fix-origin-354f fix-origin-354f
# or:
/root/deploy-mibidon.sh mibidon-app:healthy-20261011 healthy-20261011
```

## 6. Optional: tarball of this source from the VPS

If you prefer a zip over git:

```bash
scp -P 31772 root@45.7.229.146:/root/mibidon-src-for-local-20261011.tgz .
tar -xzf mibidon-src-for-local-20261011.tgz
```

The tarball excludes `node_modules`, `.next`, and `.env`.
