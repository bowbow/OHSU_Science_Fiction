#!/usr/bin/env bash
set -euo pipefail

backup_kind="${1:-}"
if [[ ! "$backup_kind" =~ ^(weekly|pre-deploy|manual)$ ]]; then
  echo "usage: backup-database.sh <weekly|pre-deploy|manual>" >&2
  exit 64
fi

: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
: "${AWS_REGION:?AWS_REGION is required}"

database_path="${BOOKCLUB_SQLITE_PATH:-/var/lib/bookclub/bookclub.sqlite}"
if [[ ! -s "$database_path" ]]; then
  echo "No BookClub database exists at $database_path; backup skipped."
  exit 0
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
temporary_directory="/var/lib/bookclub/backups"
backup_path=""

cleanup() {
  if [[ -n "$backup_path" ]]; then
    rm -f -- "$backup_path"
  fi
}
trap cleanup EXIT

backup_path="$(/usr/local/bin/node --experimental-strip-types \
  "$script_dir/sqlite-backup.ts" backup "$database_path" "$temporary_directory")"
backup_name="$(basename "$backup_path")"
object_key="database/${backup_kind}/${backup_name}"

aws s3 cp "$backup_path" "s3://${BACKUP_BUCKET}/${object_key}" \
  --region "$AWS_REGION" \
  --only-show-errors \
  --sse AES256

echo "Uploaded verified BookClub database backup to s3://${BACKUP_BUCKET}/${object_key}."
