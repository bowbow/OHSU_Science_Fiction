#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -ne 6 ]]; then
  echo "usage: remote-deploy.sh <archive> <release-id> <sha256> <public-url> <backup-bucket> <google-books-parameter>" >&2
  exit 64
fi

archive="$1"
release_id="$2"
expected_hash="$3"
public_url="$4"
backup_bucket="$5"
google_books_parameter="$6"

if [[ ! "$release_id" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Invalid release id." >&2
  exit 65
fi

if [[ ! "$backup_bucket" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
  echo "Invalid backup bucket name." >&2
  exit 65
fi

if [[ ! "$google_books_parameter" =~ ^/[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)*$ ]]; then
  echo "Invalid Google Books parameter name." >&2
  exit 65
fi

actual_hash="$(sha256sum "$archive" | awk '{print $1}')"
if [[ "$actual_hash" != "$expected_hash" ]]; then
  echo "Release archive SHA-256 mismatch." >&2
  exit 66
fi

if tar -tzf "$archive" | grep -E '(^|/)(data(/|$)|[^/]*\.sqlite3?($|/)|terraform\.tfstate($|\.)|\.env($|\.))' >/dev/null; then
  echo "Release archive contains a forbidden data, database, state, or environment path." >&2
  exit 67
fi

releases_root="/opt/bookclub/releases"
release_path="${releases_root}/${release_id}"
staging_path="${release_path}.staging"
previous_release=""

if [[ -L /opt/bookclub/current ]]; then
  previous_release="$(readlink -f /opt/bookclub/current)"
fi

rm -rf "$staging_path"
install -d -o bookclub -g bookclub -m 0755 "$staging_path"
tar -xzf "$archive" -C "$staging_path"

if [[ ! -f "$staging_path/package.json" || ! -f "$staging_path/apps/web/src/server.ts" ]]; then
  echo "Release archive does not contain the BookClub application." >&2
  rm -rf "$staging_path"
  exit 68
fi

cd "$staging_path"
/usr/local/bin/npm ci --omit=dev --ignore-scripts
chown -R bookclub:bookclub "$staging_path"

google_books_api_key="$(aws ssm get-parameter \
  --region "${AWS_REGION:-us-east-1}" \
  --name "$google_books_parameter" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)"
if [[ -z "$google_books_api_key" || "$google_books_api_key" == "None" || "$google_books_api_key" == *$'\n'* ]]; then
  echo "Google Books API key could not be loaded from Parameter Store." >&2
  exit 68
fi
umask 0077
printf 'GOOGLE_BOOKS_API_KEY=%s\n' "$google_books_api_key" >/etc/bookclub-secrets.env.new
chown root:bookclub /etc/bookclub-secrets.env.new
chmod 0640 /etc/bookclub-secrets.env.new
mv -f /etc/bookclub-secrets.env.new /etc/bookclub-secrets.env
unset google_books_api_key

install -d -o bookclub -g bookclub -m 0700 /var/lib/bookclub/backups
runuser -u bookclub -- env \
  BACKUP_BUCKET="$backup_bucket" \
  AWS_REGION="${AWS_REGION:-us-east-1}" \
  BOOKCLUB_SQLITE_PATH=/var/lib/bookclub/bookclub.sqlite \
  /bin/bash "$staging_path/scripts/backup-database.sh" pre-deploy

runuser -u bookclub -- /usr/local/bin/node --experimental-strip-types \
  "$staging_path/scripts/migrate-feedback.ts" \
  /var/lib/bookclub/bookclub.sqlite

if [[ ! -d "$release_path" ]]; then
  mv "$staging_path" "$release_path"
else
  rm -rf "$staging_path"
fi

cat >/etc/bookclub.env <<EOF
PORT=3000
PUBLIC_BASE_URL=${public_url}
BOOKCLUB_SQLITE_PATH=/var/lib/bookclub/bookclub.sqlite
BOOKCLUB_INITIALIZE_DATABASE=false
EOF
chmod 0644 /etc/bookclub.env

install -d -m 0755 /etc/systemd/system/bookclub.service.d
cat >/etc/systemd/system/bookclub.service.d/20-google-books.conf <<'EOF'
[Service]
EnvironmentFile=/etc/bookclub-secrets.env
EOF

cat >/etc/bookclub-backup.env <<EOF
BACKUP_BUCKET=${backup_bucket}
AWS_REGION=${AWS_REGION:-us-east-1}
BOOKCLUB_SQLITE_PATH=/var/lib/bookclub/bookclub.sqlite
EOF
chown root:bookclub /etc/bookclub-backup.env
chmod 0640 /etc/bookclub-backup.env

cat >/etc/systemd/system/bookclub-backup.service <<'EOF'
[Unit]
Description=Create and upload a verified BookClub SQLite backup
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=bookclub
Group=bookclub
WorkingDirectory=/opt/bookclub/current
EnvironmentFile=/etc/bookclub.env
EnvironmentFile=/etc/bookclub-backup.env
ExecStart=/bin/bash /opt/bookclub/current/scripts/backup-database.sh weekly
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/bookclub/backups
EOF

cat >/etc/systemd/system/bookclub-backup.timer <<'EOF'
[Unit]
Description=Create a weekly BookClub database backup

[Timer]
OnCalendar=Sun *-*-* 12:00:00 America/Los_Angeles
Persistent=true
RandomizedDelaySec=15m
Unit=bookclub-backup.service

[Install]
WantedBy=timers.target
EOF

ln -sfn "$release_path" /opt/bookclub/current.next
mv -Tf /opt/bookclub/current.next /opt/bookclub/current
systemctl daemon-reload
systemctl restart bookclub

healthy=false
for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:3000/health | grep -q '"status":"ok"'; then
    healthy=true
    break
  fi
  sleep 2
done

if [[ "$healthy" != "true" ]]; then
  echo "New release failed its local health check." >&2
  if [[ -n "$previous_release" && -d "$previous_release" ]]; then
    ln -sfn "$previous_release" /opt/bookclub/current.rollback
    mv -Tf /opt/bookclub/current.rollback /opt/bookclub/current
    systemctl restart bookclub
    echo "Restored previous release $previous_release." >&2
  fi
  exit 69
fi

systemctl enable --now bookclub-backup.timer

find "$releases_root" -mindepth 1 -maxdepth 1 -type d ! -path "$release_path" \
  -printf '%T@ %p\n' | sort -nr | awk 'NR > 3 {print $2}' | xargs --no-run-if-empty rm -rf --

echo "Activated BookClub release $release_id."
