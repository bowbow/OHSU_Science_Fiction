# BookClub

BookClub is a TypeScript website with reusable club rules in `packages/core` and a thin web client in `apps/web`.

## Local development

Requirements: Node.js 24 or newer.

```powershell
npm install
npm test
npm start
```

The local database defaults to `data/bookclub.sqlite`.

Database initialization is enabled by default for local development. Set
`BOOKCLUB_INITIALIZE_DATABASE=false` to require an existing database and skip all
automatic table creation and schema upgrades. Production sets this to `false` so
application startup does not change the schema. Administrator accounts are never
created automatically by application startup.

### Google Books API configuration

Open Library supplies the book choices and the cover selected by an administrator.
The application retains that choice's exact Open Library edition key, work key,
and work-level ISBN set. It tries the selected edition's ISBN first; if Google
does not have that edition, it accepts another edition only when Google reports an
ISBN that Open Library assigns to the same work. If that identity cannot be
established, the site shows no Google Books details rather than risk describing a
different book. An available Open Library cover always takes precedence over a
Google Books cover.

Use separate Google Books API keys for local development and production. In
[Google Cloud Console](https://console.cloud.google.com/), enable the Google Books
API, create an API key for each environment, and restrict both keys to the Google
Books API. Where practical, also restrict each key to the public IP addresses that
will use it. The production Elastic IP is available with:

```powershell
terraform -chdir=infra/aws output -raw elastic_ip
```

For local development, create the ignored file `.env.local` in the repository
root:

```dotenv
GOOGLE_BOOKS_API_KEY=your-local-key
```

`npm run dev` and `npm start` load this file automatically. It is excluded from
Git and from deployment archives.

The production key is intentionally not supplied to Terraform because Terraform
would then record the secret in its state. Create it manually as a Standard
`SecureString` in AWS Systems Manager Parameter Store in `us-east-1`, using the
default `aws/ssm` encryption key and this exact name:

```text
/bookclub-production/google-books-api-key
```

Terraform manages the supporting infrastructure, including a narrowly scoped
`ssm:GetParameter` permission for only this parameter. During deployment, the EC2
instance retrieves and decrypts the value directly and stores it in
`/etc/bookclub-secrets.env`, owned by `root:bookclub` with mode `0640`. The API
keys must never be written to logs, release archives, Git, or Terraform state.

Download the production activity log through Systems Manager (no SSH required):

```powershell
./scripts/view-server-log.ps1
```

This downloads the log to a timestamped `.log` file under `data/` and immediately
pages through it with `more`. UTC timestamps are converted for display to this
computer's local timezone, including its UTC offset; the downloaded file remains
unchanged in UTC. Press Space for the next page or Q to quit. Use `-Utc` to display
the original UTC timestamps, or `-OutputPath .\activity.log` to choose a different
local destination. To download without opening the pager, use
`./scripts/download-activity-log.ps1` with the same options. The EC2 instance must
be running and online in Systems Manager.

To view a log that has already been downloaded, without contacting AWS again:

```powershell
./scripts/view-server-log.ps1 activity-20261026-120000.log
```

Replace the filename with the downloaded log you want to inspect. The script
looks in the repository's `data` directory automatically, uses the same local-time
conversion and pager, and does not contact AWS. Add `-Utc` to display that file
unchanged. The older named form, `-InputPath activity-...log`, remains supported.

## AWS deployment

The production deployment is defined in [specs/010-deploy-aws-ec2](specs/010-deploy-aws-ec2). It uses one Amazon Linux EC2 instance in `us-east-1`, an Elastic IP, Nginx, systemd, Systems Manager, and a private S3 release bucket. Docker and inbound SSH are not required. The instance stops at 9:00pm Pacific and starts at 7:00am Pacific. The disk and public address stay in place, and the site is unreachable while the instance is stopped.

Requirements:

- Terraform 1.10 or newer
- AWS CLI v2
- Node.js 24 or newer
- An AWS CLI profile with permission to manage the resources above

Authenticate and verify the profile without exposing keys:

```powershell
aws sts get-caller-identity --profile default
```

Never commit or paste AWS access keys, secret access keys, session tokens, `.env` files, Terraform state, or `*.tfvars`. The scripts default to the existing `default` profile and accept `-AwsProfile` when a dedicated least-privilege deployment profile is introduced.

Review and provision:

```powershell
./scripts/provision.ps1 -PlanOnly
./scripts/provision.ps1
```

Deploy application code:

```powershell
./scripts/deploy.ps1
```

Production SQLite data is stored at `/var/lib/bookclub/bookclub.sqlite`, outside `/opt/bookclub/releases`; deploying code never packages or removes it. Keep a private backup of `infra/aws/terraform.tfstate`, because the initial design intentionally uses local Terraform state. A remote encrypted state backend is the recommended upgrade when more than one computer or operator manages the environment.

## Database backups

Terraform creates a separate private S3 bucket for database backups. Public access is blocked, TLS is required, objects are encrypted at rest, versioning is enabled, and backups expire after 84 days by default. The EC2 instance role can list, upload, and read only objects under the bucket's `database/` prefix.

The EC2 resource ignores changes to the moving "latest Amazon Linux" AMI parameter so an unrelated Terraform apply does not replace the stateful instance and its root volume. Operating-system upgrades should be planned separately with a verified database backup.

Run `./scripts/provision.ps1` once to create the backup bucket and permissions before deploying a release that contains the backup scripts.

Each deployment creates a verified SQLite snapshot before activating the new release. A systemd timer also creates a weekly backup on Sunday at noon Pacific. Backup files are generated with SQLite's online backup API, checked with `PRAGMA integrity_check`, uploaded to S3, and removed from the instance afterward.

List available backups:

```powershell
$bucket = terraform -chdir=infra/aws output -raw backup_bucket
aws s3 ls "s3://$bucket/database/" --recursive --profile default --region us-east-1
```

Restore a selected object through Systems Manager by running the release's restore script as root:

```bash
sudo /bin/bash /opt/bookclub/current/scripts/restore-database.sh \
  database/weekly/bookclub-<timestamp>-<id>.sqlite
```

The restore script checks the downloaded database before stopping the application, retains the replaced database on the instance, and rolls back automatically if the restored application fails its health check.

AWS resources incur charges, including EC2 storage/compute, S3 storage, and the public IPv4 address. Use Terraform to destroy the environment when it is no longer needed. Adding the owned domain and HTTPS is intentionally deferred to a later Spec Kit feature.
