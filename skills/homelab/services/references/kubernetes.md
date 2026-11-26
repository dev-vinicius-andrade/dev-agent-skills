# Kubernetes, Helm, helmfile and GitOps Recipes

Names below are illustrative.

## Source of truth

- Find who owns the release before touching it: helmfile repository, Argo CD / Flux application, plain manifests, or a manual `helm install`. Owned by GitOps: change git only; the controller applies.
- Manual releases: offer to move them into the repository (values file + pinned chart version).

## Change flow

1. `kubectl config current-context` — confirm the cluster from the inventory before any write.
2. Edit values / manifests in the repository; pin `version:` of every chart.
3. Preview: `helmfile -e <env> diff` or `helm diff upgrade <release> <chart> -f values.yaml` (helm-diff plugin), `kubectl diff -f`.
4. Apply: `helmfile -e <env> apply --selector name=<release>` (one release), or `helm upgrade --install --atomic --timeout 10m`.
5. Verify: `kubectl rollout status deploy/<name> -n <ns>`, `kubectl get pods -n <ns>`, events, the ingress URL.
6. Rollback: `helm rollback <release> <rev> -n <ns>` or revert the git commit; data restore only if the new version migrated it.

## Workload rules

- Requests and limits on every container; liveness and readiness probes.
- Stateful data on PVCs with a known storage class and a backup (snapshot, Velero, or the app's own dump); `reclaimPolicy: Retain` for data you care about.
- Secrets via the cluster's mechanism (sealed secrets, SOPS, external secrets), never in plain values files.
- One namespace per app or app group; network policies where the cluster enforces them.
- Ingress / IngressRoute objects and certificates follow homelab:network.

## Traps

- `helm upgrade` without `--atomic` can leave a failed release; check `helm history` before retrying.
- Changing a StatefulSet's `volumeClaimTemplates` or a chart's PVC name can orphan data; read the chart's upgrade notes.
- Deleting a namespace deletes its PVCs (and with `Delete` reclaim, the data). Never without a yes and a backup.
- Selecting a subset of hosts or releases through a variable in a declarative tool can plan destruction of the unselected ones; always read the plan / diff for deletions.

## Debugging

- `kubectl describe pod`, `kubectl logs <pod> -c <container> --previous`, `kubectl get events -n <ns> --sort-by=.lastTimestamp`.
- Pending: requests vs node capacity, PVC binding, node selectors / taints.
- CrashLoopBackOff: previous logs, probes too strict, missing secret / config map.
- Service unreachable: `kubectl get endpoints`, label selectors, then the ingress / proxy route.
