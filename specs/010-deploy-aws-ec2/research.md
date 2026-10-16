# Research: Deploy BookClub to AWS EC2

## Decision 1: Terraform with local state for the first owner-managed environment

**Decision**: Use Terraform with its local backend and exclude `.terraform/`, state files, variable files, and plans from Git. Document that the state file must be retained and backed up privately.

**Rationale**: The owner requested repeatable infrastructure and currently has one operator and one environment. Terraform state gives repeated runs the resource identity required to update the same instance. Local state is the smallest initial arrangement.

**Alternatives considered**:

- S3 remote state: safer for collaboration and machine loss, but requires bootstrapping and extra resources before this first deployment. It is the recommended later migration.
- CloudFormation: also idempotent, but the user accepted Terraform and local state explicitly.
- Tag-based shell scripts: tags help discovery but do not provide Terraform's dependency graph, drift plan, or state reconciliation.

**Operational note**: Local state is plaintext operational data and must not be committed. Losing it complicates future reconciliation; keep a protected backup.

## Decision 2: Systems Manager instead of SSH

**Decision**: Use an EC2 instance profile with `AmazonSSMManagedInstanceCore` and execute remote deployment through Systems Manager Run Command. Do not open port 22 or require an EC2 key pair.

**Rationale**: Systems Manager supports secure remote command execution through AWS APIs. Session Manager and Run Command avoid public administrative ports, bastion hosts, and SSH key management.

**Alternatives considered**:

- SSH/SCP: familiar, but requires key lifecycle management and an inbound administrative path.
- AWS CodeDeploy: capable but adds an agent/application/deployment-group model that is unnecessary for one owner-triggered instance.
- CI/CD service: useful later, but the current requirement is local owner-triggered automation.

## Decision 3: Private S3 release transfer

**Decision**: Terraform creates one private, encrypted S3 bucket for deployment archives. The local deployment script uploads an immutable archive, and the EC2 role can read only that bucket.

**Rationale**: Run Command executes commands but is not a general file-upload channel. S3 provides auditable transfer without SSH. Lifecycle expiration prevents indefinite archive growth.

**Alternatives considered**:

- Git clone on EC2: requires repository credentials or public source and makes the server responsible for source-control access.
- Embed source in Run Command parameters: limited, fragile, and risks command-size and quoting failures.
- Docker registry: unnecessary because the chosen runtime is native Node.js.

## Decision 4: Native Node.js managed by systemd, fronted by Nginx

**Decision**: Install Node.js 24 on Amazon Linux 2023, run BookClub as an unprivileged `systemd` service on loopback port 3000, and expose it through Nginx on port 80.

**Rationale**: This matches the existing Node application, needs no local or remote Docker workflow, restarts after reboot, and leaves a straightforward path for future TLS termination.

**Alternatives considered**:

- Docker Compose: reproducible, but adds an image/build/runtime layer that the owner does not want and the application does not need.
- Run Node directly from a shell: lacks reliable lifecycle, restart, and boot behavior.
- Expose Node directly on port 80: requires elevated binding or capabilities and makes future HTTPS configuration less clean.

## Decision 5: Elastic IP for the initial stable address

**Decision**: Allocate and associate one Elastic IP and output `http://<address>`.

**Rationale**: An Elastic IP is a stable public IPv4 address that can later become the target of a domain record without changing application data or deployment mechanics.

**Alternatives considered**:

- Automatically assigned public IP: may change after stop/start.
- Application Load Balancer: adds cost and complexity for one small instance.
- Custom domain immediately: explicitly deferred by the owner.

**Cost note**: AWS charges for public IPv4 addresses, including Elastic IP addresses. The Terraform output and documentation must make the resource visible so it can be destroyed when no longer needed.

## Decision 6: Persistent SQLite outside immutable releases

**Decision**: Store production data at `/var/lib/bookclub/bookclub.sqlite`; store releases under `/opt/bookclub/releases/<release-id>`; activate with `/opt/bookclub/current`.

**Rationale**: Replacing a release directory cannot replace the database. The service receives the database path through `BOOKCLUB_SQLITE_PATH`, which the existing configuration already supports.

**Alternatives considered**:

- Database within the checked-out repository: simple locally but unsafe during replacement.
- EBS data volume dedicated to SQLite: improves independent volume lifecycle but adds mounting and replacement complexity for the first single-instance release.
- Managed relational database: unnecessary cost and migration for current club scale.

## Decision 7: Health endpoint and activation verification

**Decision**: Add unauthenticated `GET /health` returning a minimal status response with no club data. Deployment checks it through the public endpoint after service restart.

**Rationale**: A deterministic health contract lets automation distinguish command completion from a usable website without exposing private information.

**Alternatives considered**:

- Check the sign-in page: couples deployment health to presentation markup.
- Process-only check: confirms a process exists but not that Nginx and HTTP routing work.

## Sources

- AWS Systems Manager Session Manager documentation: secure node management without inbound ports or SSH keys.
- AWS Systems Manager Run Command documentation: remote administrative automation through console, CLI, or SDK.
- AWS EC2 Elastic IP documentation: static public IPv4 behavior and public IPv4 charges.
- HashiCorp Terraform state and backend documentation: local state behavior, locking, sensitivity, and remote-backend migration guidance.
