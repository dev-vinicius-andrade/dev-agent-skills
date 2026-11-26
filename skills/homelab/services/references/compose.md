# Docker Compose and Portainer Recipes

Names below are illustrative.

## File shape

```yaml
services:
  app:
    image: ghcr.io/example/app:1.4.2        # pinned, never :latest
    restart: unless-stopped
    env_file: [.env]                          # .env is git-ignored; .env.example is committed
    volumes:
      - app-data:/data
    networks: [proxy, backend]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    deploy:
      resources:
        limits: { memory: 512m }
    labels: {}                                # reverse-proxy labels: see homelab:network
volumes:
  app-data: {}
networks:
  proxy: { external: true }
  backend: {}
```

- One compose project per service group, in its own folder of the infrastructure repository.
- Publish ports only when nothing proxies the service; bind to a specific interface (`10.0.10.11:8080:8080`) rather than `0.0.0.0` when possible.
- Databases sit on an internal network with no published port.
- Same `PUID` / `PGID` / `TZ` convention across services when the images support it; read it from the inventory.

## Update

1. Read release notes between current and target tag.
2. Back up: `docker run --rm -v app-data:/v -v "$PWD":/b alpine tar czf /b/app-data-$(date +%F).tgz -C /v .` (or the dataset / VM snapshot the inventory names). Dump databases with their own tool (`pg_dump`, `mysqldump`) rather than copying live files.
3. Change the tag in the repository; `docker compose config` to check the merged file.
4. `docker compose pull app && docker compose up -d app`.
5. Verify: `docker compose ps` (healthy), `docker compose logs --since 5m app`, the URL through its proxy route.
6. Rollback: restore the old tag, `docker compose up -d app`; restore the backup only when the new version migrated data.

## Portainer

- A stack deployed "from repository" is owned by the repository: change git, then redeploy / let the webhook pull. A stack created in the web editor is the source of truth only until it is moved to git; offer to move it.
- Use the Portainer API with a token from the inventory's secret location; never paste the token into chat.

## Debugging

- `docker compose ps`, `docker inspect --format '{{json .State.Health}}' <c>`, `docker compose logs -f --tail 200 <svc>`.
- Network: `docker network inspect <net>`; test from inside: `docker compose exec <svc> wget -qO- http://<other>:<port>`.
- Restart loops: check exit code, healthcheck command, volume permissions (`ls -ln` on the mount vs `PUID`), missing env.
- Disk: `docker system df`; clean targeted (`docker image prune` for dangling images), never `prune -a --volumes` without a yes.
