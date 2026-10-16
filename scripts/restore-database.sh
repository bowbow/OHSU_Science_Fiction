#!/usr/bin/env bash
set -euo pipefail

if [[ "$EUID" -ne 0 ]]; then
  echo "restore-database.sh must run as root." >&2
  exit 77
fi

if [[ -f /etc/bookclub-backup.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/bookclub-backup.env
  set +a
fi

object_key="${1:-}"
if [[ ! "$object_key" =~ ^database/(weekly|pre-deploy|manual)/[^/]+\.sqlite$ ]]; then
  echo "usage: restore-database.sh database/<weekly|pre-deploy|manual>/<backup>.sqlite" >&2
  exit 64
fi

: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
: "${AWS_REGION:?AWS_REGION is required}"

database_path="${BOOKCLUB_SQLITE_PATH:-/var/lib/bookclub/bookclub.sqlite}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
restore_directory="$(mktemp -d /var/lib/bookclub/restore.XXXXXX)"
download_path="${restore_directory}/restore.sqlite"
replacement_path="${database_path}.restore"
rollback_path="${database_path}.before-restore-$(date -u +%Y%m%dT%H%M%SZ)"
service_stopped=false

cleanup() {
  rm -f -- "$replacement_path"
  rm -rf -- "$restore_directory"
  if [[ "$service_stopped" == "true" ]]; then
    systemctl start bookclub >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

aws s3 cp "s3://${BACKUP_BUCKET}/${object_key}" "$download_path" \
  --region "$AWS_REGION" \
  --only-show-errors
/usr/local/bin/node --experimental-strip-types "$script_dir/sqlite-backup.ts" verify "$download_path"

systemctl stop bookclub
service_stopped=true

cp --preserve=mode,ownership,timestamps "$database_path" "$rollback_path"
install -o bookclub -g bookclub -m 0600 "$download_path" "$replacement_path"
mv -f -- "$replacement_path" "$database_path"

if ! systemctl start bookclub; then
  mv -f -- "$rollback_path" "$database_path"
  systemctl start bookclub
  service_stopped=false
  echo "Restore failed to start BookClub; the prior database was restored." >&2
  exit 1
fi
service_stopped=false

healthy=false
for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3000/health | grep -q '"status":"ok"'; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "$healthy" != "true" ]]; then
  systemctl stop bookclub
  mv -f -- "$rollback_path" "$database_path"
  systemctl start bookclub
  echo "Restored database failed its health check; the prior database was restored." >&2
  exit 1
fi

echo "Restored s3://${BACKUP_BUCKET}/${object_key}. Previous database retained at ${rollback_path}."
