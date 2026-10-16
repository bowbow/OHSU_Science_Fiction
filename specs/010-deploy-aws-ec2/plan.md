# Implementation Plan: Deploy BookClub to AWS EC2

**Branch**: `010-deploy-aws-ec2` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-deploy-aws-ec2/spec.md`

## Summary

Provision one small Amazon Linux 2023 EC2 instance in `us-east-1` with Terraform, an Elastic IP, HTTP-only security-group access, an IAM instance profile for Systems Manager, and a private S3 release bucket. Deploy BookClub through a PowerShell command that packages the repository, uploads the immutable package to S3, invokes an idempotent Systems Manager Run Command, switches a `/opt/bookclub/current` symlink only after setup succeeds, restarts a `systemd` service, and checks `/health`. Keep SQLite at `/var/lib/bookclub/bookclub.sqlite`, outside release directories. Nginx provides the initial public HTTP endpoint. No Docker or SSH is required.

## Technical Context

**Language/Version**: TypeScript executed by Node.js 24; PowerShell 7-compatible local automation; Bash on Amazon Linux 2023; Terraform >= 1.10

**Primary Dependencies**: AWS provider for Terraform; AWS CLI v2; AWS Systems Manager Run Command; Amazon S3; Nginx; systemd

**Storage**: SQLite at `/var/lib/bookclub/bookclub.sqlite`; private S3 bucket for short-lived release artifacts; local Terraform state excluded from Git

**Testing**: Existing Node test runner; `terraform fmt -check`; `terraform validate`; PowerShell script parsing; shell syntax checks where available; post-deployment HTTP health and persistence checks

**Target Platform**: One Amazon Linux 2023 EC2 instance in AWS `us-east-1`, reachable over IPv4 HTTP

**Project Type**: TypeScript monorepo web application plus infrastructure-as-code and deployment automation

**Performance Goals**: Deployment health check succeeds within 10 minutes; routine restart returns the site within 5 minutes; infrastructure no-change rerun creates zero resources

**Constraints**: No Docker; no inbound SSH; one EC2 instance; public HTTP initially; persistent local SQLite; no committed credentials or Terraform state; custom domain and HTTPS deferred

**AWS Authentication**: Use the authenticated local AWS CLI profile `default` initially. Every script accepts `-AwsProfile` and passes the profile to AWS CLI and Terraform through `AWS_PROFILE`. Credentials remain in the user's standard AWS CLI store; scripts verify identity with STS and never print or persist key material.

**Scale/Scope**: One small private book club, one production environment, one owner-triggered deployment at a time

## Constitution Check

*GATE: Passed before research and passed again after design.*

- **I. Specification Before Implementation**: PASS. This feature has a specification; tasks and implementation follow this plan.
- **II. Verified Behavior**: PASS. The quickstart defines idempotency, health, restart, and database-persistence checks.
- **III. Club Data Stays in the Club**: PASS. SQLite is not packaged or uploaded; the release bucket is private; no credentials or state enter Git. Public web access does not alter the application's existing authentication rules.
- **IV. Smallest Design That Meets the Spec**: PASS. A single EC2 host, Nginx, systemd, SSM, and one temporary release bucket are the minimum practical design that avoids Docker and SSH while allowing automated delivery.
- **V. Consistent, Recoverable Changes**: PASS. Release directories are immutable, activation uses a symlink, and the persistent database is outside the release tree. The previous release remains available for rollback.
- **VI. Platform-Independent Core**: PASS. Deployment does not move behavior into the web client; `packages/core` remains UI-independent. `/health` is a web-host concern only.

## Project Structure

### Documentation (this feature)

```text
specs/010-deploy-aws-ec2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── deployment-command.md
│   ├── health-endpoint.md
│   └── infrastructure-outputs.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── app.ts                 # add web-only health route
│   └── server.ts
└── test/                      # health route tests

packages/core/                 # unchanged platform-independent behavior

infra/aws/
├── main.tf                    # provider, AMI lookup, EC2, EIP, IAM, S3
├── variables.tf
├── outputs.tf
├── versions.tf
├── user-data.sh               # idempotent host bootstrap
└── terraform.tfvars.example

scripts/
├── provision.ps1              # init, plan, apply, and output wrapper
├── deploy.ps1                 # package, upload, Run Command, wait, health check
└── remote-deploy.sh           # idempotent release install/activation logic

.gitignore                     # Terraform, plans, release archives, credentials
```

**Structure Decision**: Preserve the existing `apps/web` and `packages/core` boundary. Put AWS infrastructure in `infra/aws` and owner-triggered automation in `scripts`. Production operations remain adapters around the application and do not enter the reusable core.

## Deployment Design

1. `scripts/provision.ps1` checks required CLIs and verifies the selected AWS profile (defaulting to `default`) with STS, then runs Terraform init, plan, and apply in `infra/aws` with `AWS_PROFILE` scoped to the process.
2. Terraform uses the default VPC and a public subnet, resolves the current Amazon Linux 2023 AMI through AWS's public SSM parameter, creates one tagged EC2 instance, associates one Elastic IP, and permits inbound TCP 80 only.
3. The instance profile includes `AmazonSSMManagedInstanceCore` plus read access restricted to the generated release bucket. The bucket blocks all public access and expires old release objects.
4. Idempotent user data installs Node.js 24, Nginx, and deployment prerequisites; creates `bookclub`; creates `/opt/bookclub/releases` and `/var/lib/bookclub`; installs the service and proxy configuration; and never initializes or removes the production database.
5. `scripts/deploy.ps1` runs tests, builds a release archive that excludes data, state, Git metadata, and secrets, uploads it under a content/revision key, and sends its metadata to the tagged instance with Systems Manager Run Command.
6. `scripts/remote-deploy.sh` downloads and verifies the archive, extracts it into a new release directory, installs production dependencies if required, atomically updates `/opt/bookclub/current`, and restarts `bookclub.service`.
7. `bookclub.service` runs as the unprivileged `bookclub` user with `PORT=3000`, `PUBLIC_BASE_URL=http://<elastic-ip>`, and `BOOKCLUB_SQLITE_PATH=/var/lib/bookclub/bookclub.sqlite`. Nginx proxies port 80 to loopback port 3000.
8. Deployment waits for Run Command completion and verifies `http://<elastic-ip>/health`. A failed pre-activation step leaves the current symlink and database untouched. A failed post-activation health check reports failure and retains prior releases for explicit rollback.

## Complexity Tracking

No constitution violations require justification.
