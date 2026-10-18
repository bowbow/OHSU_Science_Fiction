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

Download the production activity log through Systems Manager (no SSH required):

```powershell
./scripts/download-activity-log.ps1 -AwsProfile default
```

The default destination is a timestamped `.log` file under `data/`. Use
`-OutputPath .\activity.log` to choose a different local destination. The EC2
instance must be running and online in Systems Manager.

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
./scripts/provision.ps1 -AwsProfile default -PlanOnly
./scripts/provision.ps1 -AwsProfile default
```

Deploy application code:

```powershell
./scripts/deploy.ps1 -AwsProfile default
```

Production SQLite data is stored at `/var/lib/bookclub/bookclub.sqlite`, outside `/opt/bookclub/releases`; deploying code never packages or removes it. Keep a private backup of `infra/aws/terraform.tfstate`, because the initial design intentionally uses local Terraform state. A remote encrypted state backend is the recommended upgrade when more than one computer or operator manages the environment.

## Database backups

Terraform creates a separate private S3 bucket for database backups. Public access is blocked, TLS is required, objects are encrypted at rest, versioning is enabled, and backups expire after 84 days by default. The EC2 instance role can list, upload, and read only objects under the bucket's `database/` prefix.

The EC2 resource ignores changes to the moving "latest Amazon Linux" AMI parameter so an unrelated Terraform apply does not replace the stateful instance and its root volume. Operating-system upgrades should be planned separately with a verified database backup.

Run `./scripts/provision.ps1 -AwsProfile default` once to create the backup bucket and permissions before deploying a release that contains the backup scripts.

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
