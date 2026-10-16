# Feature Specification: Deploy BookClub to AWS EC2

**Feature Branch**: `010-deploy-aws-ec2`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Deploy BookClub to one EC2 instance in us-east-1 using an idempotent infrastructure script and a separate automated deployment script. Repeated runs must reuse the same instance and preserve the SQLite database. Initially expose the site without the owned custom domain, while allowing a domain and HTTPS to be added later."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provision a Repeatable Hosting Environment (Priority: P1)

As the site owner, I can trigger infrastructure provisioning repeatedly and obtain one reachable BookClub hosting environment without creating duplicate servers.

**Why this priority**: The application cannot be deployed safely until its hosting environment exists and can be managed predictably.

**Independent Test**: Run infrastructure provisioning twice with the same configuration and verify that the second run reports no duplicate server creation and returns the same public address.

**Acceptance Scenarios**:

1. **Given** no BookClub cloud environment exists, **When** the owner provisions it in `us-east-1`, **Then** one server and the networking needed for public web access are created.
2. **Given** the BookClub cloud environment already exists, **When** the owner provisions it again without configuration changes, **Then** the existing environment is retained and no additional server is created.
3. **Given** provisioning succeeds, **When** the owner inspects its outputs, **Then** a public address for the site is provided.

---

### User Story 2 - Deploy Application Changes Automatically (Priority: P2)

As the site owner, I can trigger a deployment that installs the current BookClub release, starts it automatically, and makes it reachable without manually logging in to the server.

**Why this priority**: Repeatable deployment is required to deliver future BookClub features reliably.

**Independent Test**: Trigger deployment against a provisioned environment, verify the health check succeeds, then deploy the same release again and verify the site remains available.

**Acceptance Scenarios**:

1. **Given** the hosting environment exists, **When** the owner triggers deployment, **Then** the current application is installed, started, and reachable at the environment's public address.
2. **Given** the same release is already deployed, **When** deployment is triggered again, **Then** it completes without creating another server or damaging the running application.
3. **Given** the server restarts, **When** startup completes, **Then** the BookClub application starts without manual intervention.

---

### User Story 3 - Preserve Club Data Across Deployments (Priority: P3)

As the site owner, I can deploy new application releases without losing registered users, book suggestions, votes, meeting dates, or other SQLite-backed club data.

**Why this priority**: Deployment must not destroy the club's accumulated state.

**Independent Test**: Create recognizable application data, deploy a new release, and verify the same data is visible afterward.

**Acceptance Scenarios**:

1. **Given** the live database contains club data, **When** a new application release is deployed, **Then** the database and its data remain intact.
2. **Given** deployment fails before the new release is activated, **When** the failure is reported, **Then** the existing database remains intact and the previous release is not deliberately erased.
3. **Given** application code is replaced, **When** the new release starts, **Then** it uses the persistent database location rather than creating a new deployment-local database.

### Edge Cases

- Provisioning is interrupted and then retried.
- Deployment is triggered before infrastructure provisioning has completed.
- Deployment is triggered while the application is already running.
- A release fails its health check after installation.
- The server reboots after a successful deployment.
- The application package accidentally contains a local development database.
- The public address changes unexpectedly or the networking rules do not permit HTTP access.
- A future domain and HTTPS configuration is added without migrating application data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The infrastructure workflow MUST provision the BookClub environment in AWS region `us-east-1`.
- **FR-002**: The infrastructure workflow MUST be idempotent for a given environment configuration.
- **FR-003**: Repeated infrastructure runs MUST manage one BookClub application server and MUST NOT create an additional server when no replacement-requiring configuration has changed.
- **FR-004**: The environment MUST expose the website through a stable public address suitable for initial use without a custom domain.
- **FR-005**: Public inbound access MUST be limited to web traffic required to reach the application; routine deployment MUST NOT require a publicly exposed remote-login port.
- **FR-006**: Infrastructure provisioning and application deployment MUST be separate, independently triggerable workflows.
- **FR-007**: The deployment workflow MUST install or update the BookClub application without requiring interactive server login.
- **FR-008**: Repeated deployments of the same release MUST complete safely and MUST NOT create additional cloud servers.
- **FR-009**: The application MUST restart automatically after a server reboot or application failure.
- **FR-010**: The production SQLite database MUST reside outside directories replaced during application deployment.
- **FR-011**: Application deployments MUST preserve the production SQLite database and all existing club data.
- **FR-012**: Deployment packages MUST exclude local development databases, credentials, infrastructure state, and other machine-specific secrets.
- **FR-013**: The deployment workflow MUST verify application health before reporting success.
- **FR-014**: Infrastructure and deployment failures MUST return a non-success result with enough information to identify the failed stage.
- **FR-015**: The infrastructure design MUST permit later attachment of the owner's domain and HTTPS without replacing or resetting the production database.
- **FR-016**: Cloud credentials, application secrets, and infrastructure state MUST NOT be committed to source control.
- **FR-017**: The environment MUST provide outputs identifying the server and its public site address.
- **FR-018**: The server MUST stop at 9:00pm Pacific and start at 7:00am Pacific. Stopping MUST keep the disk, the public address, and the club data. The site MUST come back on that same address when the server starts.

### Key Entities *(include if feature involves data)*

- **Deployment Environment**: The named AWS environment in `us-east-1`, including its single server, network access rules, public address, and management permissions.
- **Application Release**: A packaged revision of BookClub code and runtime metadata that can be installed repeatedly.
- **Persistent Club Database**: The production SQLite database retained independently of application release directories.
- **Infrastructure State**: The local record used to reconcile the desired environment with existing AWS resources; it is private operational data and is not committed.
- **Deployment Result**: The success or failure outcome, health-check result, deployed revision, and public address reported to the owner.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Running infrastructure provisioning twice without configuration changes results in exactly one BookClub application server.
- **SC-002**: A deployment can be triggered with one owner command and requires no interactive server login.
- **SC-003**: A successful deployment reports a reachable public site address and passes an automated health check within 10 minutes.
- **SC-004**: All pre-deployment club data remains available after both a repeated deployment and a server restart.
- **SC-005**: A failed deployment never deletes or replaces the persistent club database.
- **SC-006**: The site returns to service automatically within 5 minutes after a routine server restart.
- **SC-007**: A future domain can be introduced by changing infrastructure configuration without moving or recreating the club database.

## Assumptions

- The owner has an AWS account, permission to create the required resources, and locally configured AWS credentials when provisioning or deploying.
- The initial automation uses the existing AWS CLI profile named `default`; scripts accept a profile parameter so a dedicated deployment identity can replace it later.
- AWS credentials remain in the standard local AWS CLI credential store and are never copied into the repository, Terraform variables, release archives, or the EC2 instance.
- This is a small, single-club website for which one EC2 instance and one local SQLite database are appropriate initially.
- The first release is reached by an Elastic IP or AWS-provided hostname over HTTP; custom DNS and HTTPS are outside this feature.
- Terraform state is stored locally for the first version, excluded from source control, and retained on the owner's provisioning computer.
- Deployment is performed through AWS Systems Manager rather than SSH.
- The EC2 host runs the application directly with Node.js as a managed operating-system service; Docker is not required locally or remotely.
- The existing platform-independent core and web application architecture remain unchanged.
