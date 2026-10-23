#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="24.19.0"
NODE_ARCHIVE="node-v${NODE_VERSION}-linux-x64.tar.xz"

dnf install -y nginx tar gzip xz awscli

if ! id bookclub >/dev/null 2>&1; then
  useradd --system --home-dir /var/lib/bookclub --shell /sbin/nologin bookclub
fi

install -d -o bookclub -g bookclub -m 0750 /var/lib/bookclub
install -d -o bookclub -g bookclub -m 0755 /opt/bookclub/releases

if [[ ! -x /usr/local/bin/node ]] || [[ "$(/usr/local/bin/node --version)" != "v${NODE_VERSION}" ]]; then
  curl --fail --silent --show-error --location \
    "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}" \
    --output "/tmp/${NODE_ARCHIVE}"
  tar -xJf "/tmp/${NODE_ARCHIVE}" -C /usr/local --strip-components=1
  rm -f "/tmp/${NODE_ARCHIVE}"
fi

cat >/etc/bookclub.env <<'EOF'
PORT=3000
PUBLIC_BASE_URL=http://localhost
BOOKCLUB_SQLITE_PATH=/var/lib/bookclub/bookclub.sqlite
BOOKCLUB_INITIALIZE_DATABASE=false
EOF
chmod 0644 /etc/bookclub.env

cat >/etc/systemd/system/bookclub.service <<'EOF'
[Unit]
Description=BookClub web application
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=bookclub
Group=bookclub
WorkingDirectory=/opt/bookclub/current
EnvironmentFile=/etc/bookclub.env
EnvironmentFile=-/etc/bookclub-secrets.env
ExecStart=/usr/local/bin/node --experimental-strip-types apps/web/src/server.ts
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/bookclub

[Install]
WantedBy=multi-user.target
EOF

cat >/etc/nginx/conf.d/bookclub.conf <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

rm -f /etc/nginx/conf.d/default.conf
systemctl daemon-reload
systemctl enable nginx bookclub amazon-ssm-agent
systemctl restart nginx
systemctl restart amazon-ssm-agent
