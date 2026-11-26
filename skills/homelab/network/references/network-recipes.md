# Network Recipes

Names, addresses and domains below are illustrative.

## DNS

- Know which server answers for which clients (router resolver, Pi-hole / AdGuard, Technitium, Unbound, CoreDNS) and whether names are split-horizon (internal answer differs from public).
- Lower TTL before a planned change; raise it after.
- Prefer one wildcard for proxied names (`*.lab.example.net -> proxy`) plus explicit records for non-proxied hosts.
- Verify against each server: `dig +short app.lab.example.net @10.0.10.53`, and public: `dig +short app.example.net @1.1.1.1`.
- Never publish internal-only names or private addresses in public DNS.

## Reverse proxy

- Know every proxy instance and which traffic each serves (internal vs external entrypoints, edge vs cluster). Add the route to the right one.
- Route = host rule + entrypoint + TLS + middlewares (auth, headers, rate limit) + backend. Public routes always get auth and security headers.
- Traefik: routers / services / middlewares by labels, file provider or IngressRoute; check the dashboard or API for the router's status and errors. Caddy: `caddy validate` then reload. nginx: `nginx -t` then reload. HAProxy: `haproxy -c -f` then reload.
- When a tool manages the proxy's static config, change it through that tool, not the file.
- Backend over HTTPS with a self-signed cert: trust its CA or use the proxy's per-service transport option, scoped to that backend only — never skip verification globally.

## TLS

- ACME DNS-01 for internal or wildcard names (no inbound port needed); HTTP-01 only for public names on 80.
- Staging CA first for a new resolver; mind rate limits.
- DNS provider API tokens scoped to the zone, stored where the inventory says.
- Verify: `curl -vI https://app.lab.example.net 2>&1 | grep -E 'subject|issuer|expire'`.

## VPN and remote access

- WireGuard / Tailscale / Headscale: least-privilege ACLs per user or device group; subnet routes only for subnets that need it.
- Remote admin goes through VPN, never public ports.

## Firewall, port forwards, VLANs, DHCP

- Change through the router's API or UI the inventory names; export a backup first.
- New forward: created disabled, enabled only after the route, TLS and auth are verified.
- Inter-VLAN rules: allow the specific port from the specific source; IoT and guest VLANs never reach management.
- DHCP reservations for every server; record them in the inventory.

## Traps

- Asymmetric routing on multi-NIC hosts: a reply leaving by a different interface than the request is dropped by stateful firewalls. Use policy routing (per-interface routing tables) or one interface per direction.
- Hairpin NAT: LAN clients using the public name may fail without NAT reflection or split-horizon DNS.
- Docker publishes ports by editing iptables directly and can bypass host firewalls (ufw); bind to a specific address or use the `DOCKER-USER` chain.
- IPv6: a service closed on IPv4 can be open on IPv6; check both.
- Proxy dashboards and APIs (`:8080`, `:8500`-style admin ports) must never be on an external entrypoint.

## Debugging "can't reach X"

Walk the path in order and stop at the first failure: DNS answer -> TCP connect (`nc -vz host 443`) -> TLS handshake -> proxy route match (proxy logs / dashboard) -> backend health -> firewall counters / logs.
