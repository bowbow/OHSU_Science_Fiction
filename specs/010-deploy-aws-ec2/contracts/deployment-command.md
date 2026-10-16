# Contract: Owner-Triggered Deployment Command

## Invocation

```powershell
./scripts/deploy.ps1 [-AwsProfile <profile>] [-Region us-east-1]
```

The command runs from the repository root after infrastructure provisioning. `AwsProfile` defaults to `default` and remains overrideable.

## Preconditions

- Terraform, AWS CLI v2, and Node.js 24 are available locally.
- AWS credentials can read Terraform-managed outputs, upload to the release bucket, and invoke/read Systems Manager commands for the managed instance.
- The selected profile passes `aws sts get-caller-identity`; scripts display identity metadata only and never display access keys, secret keys, or session tokens.
- `infra/aws/terraform.tfstate` is present and corresponds to the target environment.

## Required Behavior

1. Verify prerequisites and AWS identity.
2. Run the complete automated test suite.
3. Resolve Terraform outputs: instance ID, release bucket, region, and site URL.
4. Package tracked application files while excluding `.git`, `.terraform`, Terraform state/plans, `.env*`, `data/`, `*.sqlite*`, logs, coverage, and dependencies.
5. Calculate SHA-256 and upload the archive under an immutable release key.
6. Invoke the remote deployment script through Systems Manager Run Command.
7. Wait for a terminal command status and surface remote standard output/error.
8. Poll `GET <site_url>/health` for a bounded interval.
9. Exit `0` only when remote activation and public health verification succeed.

## Idempotency

Deploying identical source again may reuse or reinstall the same content, but it MUST leave one active service, one current symlink, and the existing database. It MUST NOT provision infrastructure.

## Failure Contract

- Missing prerequisites, AWS authorization failure, upload failure, remote command failure, timeout, or health failure returns a nonzero exit code.
- Output identifies the failing stage and, when available, the Systems Manager command ID.
- No failure path deletes `/var/lib/bookclub/bookclub.sqlite`.
