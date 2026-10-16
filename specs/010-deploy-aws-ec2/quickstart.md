# Quickstart: Validate AWS EC2 Deployment

## Prerequisites

- Terraform >= 1.10
- AWS CLI v2 authenticated to the intended AWS account
- Node.js >= 24
- Permission to create EC2, IAM, S3, Systems Manager-related resources, security groups, and an Elastic IP in `us-east-1`
- A private backup location for `infra/aws/terraform.tfstate`

Verify the configured profile without exposing credentials:

```powershell
aws sts get-caller-identity --profile default
```

AWS resources incur charges, including the public IPv4 address. Run these scenarios only when ready to create billable resources.

## 1. Local Validation

```powershell
npm test
terraform -chdir=infra/aws fmt -check
terraform -chdir=infra/aws init
terraform -chdir=infra/aws validate
```

Expected: all commands succeed, and no Terraform state or plan appears as a tracked Git file.

## 2. First Provision

```powershell
./scripts/provision.ps1
```

Expected:

- One EC2 instance is created in `us-east-1`.
- One Elastic IP is associated.
- Port 80 is public and port 22 is not open.
- The command prints `instance_id`, `site_url`, and the release bucket.
- The instance becomes a Systems Manager managed node.

## 3. Idempotency Check

Run provisioning a second time:

```powershell
./scripts/provision.ps1
terraform -chdir=infra/aws plan -detailed-exitcode
```

Expected: the same instance ID and site URL are returned; the final plan reports no changes and creates no second EC2 instance.

## 4. First Deployment

```powershell
./scripts/deploy.ps1
```

Expected: tests pass, one release is uploaded and activated, Systems Manager reports success, and `/health` returns `{"status":"ok"}`. Open the printed site URL and sign in.

## 5. Database Persistence Check

1. Create a recognizable regular user or book suggestion through the site.
2. Run `./scripts/deploy.ps1` again.
3. Sign in and verify the data remains.
4. Restart the EC2 instance from AWS, wait up to five minutes, and verify the same data remains.

Expected: deployment and reboot preserve all SQLite-backed state.

## 6. Failure-Safety Check

Use a deliberately invalid release in a non-production rehearsal or interrupt deployment before activation. Do not run destructive experiments against valued club data.

Expected: deployment exits nonzero, reports the failed stage, leaves `/var/lib/bookclub/bookclub.sqlite` intact, and does not create another instance.

## 7. Future Domain Migration

When the owner chooses to use the existing domain, create a separate Spec Kit feature to add DNS and HTTPS termination. Point DNS at the Elastic IP and update `PUBLIC_BASE_URL` to HTTPS after certificate and proxy configuration are ready. Do not move the SQLite database or replace the deployment workflow merely to add the domain.
