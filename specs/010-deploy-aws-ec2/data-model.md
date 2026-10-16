# Data Model: AWS EC2 Deployment

This feature does not change BookClub's domain entities. It introduces operational resources and filesystem state.

## Deployment Environment

| Field | Meaning | Constraint |
|---|---|---|
| name | Stable environment identifier | Defaults to `bookclub-production`; used consistently in tags |
| region | AWS placement | Exactly `us-east-1` for this feature |
| instance_id | Managed EC2 identity | Exactly one active Terraform-managed instance |
| elastic_ip | Initial public address | Associated with the managed instance |
| site_url | User-facing initial URL | `http://` URL derived from the Elastic IP |
| release_bucket | Private artifact transfer location | Public access blocked; server role has scoped read access |
| state | Terraform's reconciliation record | Local, private, excluded from Git |

## Application Release

| Field | Meaning | Constraint |
|---|---|---|
| release_id | Immutable release identity | Git revision when available plus UTC timestamp or content hash |
| archive_key | S3 object key | Unique per release; never overwrites the database |
| archive_hash | Integrity value | SHA-256 checked before activation |
| release_path | Extracted server path | `/opt/bookclub/releases/<release_id>` |
| activated_at | Activation time | Recorded only after installation succeeds |

### Lifecycle

`packaged` → `uploaded` → `installing` → `active` → `superseded`

A failure before `active` leaves `/opt/bookclub/current` unchanged. Old releases may be pruned only after a different release is confirmed healthy.

## Persistent Club Database

| Field | Meaning | Constraint |
|---|---|---|
| path | Production SQLite location | `/var/lib/bookclub/bookclub.sqlite` |
| owner | Runtime account | Writable by `bookclub`, not by anonymous users |
| lifecycle | Persistence boundary | Never included in, extracted over, or removed by deployment |

The database remains the existing application schema. This feature changes only its configured production path.

## Service Configuration

| Field | Value |
|---|---|
| service_name | `bookclub.service` |
| runtime_user | `bookclub` |
| working_directory | `/opt/bookclub/current` |
| port | `3000`, loopback through Nginx |
| database | `/var/lib/bookclub/bookclub.sqlite` |
| public_base_url | Terraform's initial HTTP site URL |
| restart_policy | Restart on failure and start at boot |

## State Invariants

1. One Terraform environment maps to at most one managed application instance.
2. The active release symlink points to one complete release directory.
3. No release directory contains the production database.
4. Deploying or pruning releases does not modify `/var/lib/bookclub`.
5. The S3 release bucket is never publicly readable.
6. The EC2 security group has no inbound SSH rule.
