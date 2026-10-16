# Tasks: Deploy BookClub to AWS EC2

**Input**: Design documents from `/specs/010-deploy-aws-ec2/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Automated tests and infrastructure validation are required by the specification and constitution.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish deployment paths and safe generated-file exclusions.

- [X] T001 Create the AWS infrastructure and deployment script directories at infra/aws/ and scripts/
- [X] T002 Update deployment, Terraform state, plan, credential, and package exclusions in .gitignore
- [X] T003 [P] Add safe example deployment inputs in infra/aws/terraform.tfvars.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the common runtime contracts used by provisioning and deployment.

- [X] T004 Add the unauthenticated minimal GET /health route in apps/web/src/app.ts
- [X] T005 [P] Add health endpoint contract coverage in apps/web/test/health.test.ts and register it in package.json
- [X] T006 Define Terraform/provider version constraints in infra/aws/versions.tf
- [X] T007 Define validated environment inputs in infra/aws/variables.tf
- [X] T008 Define stable instance, address, bucket, region, and URL outputs in infra/aws/outputs.tf

**Checkpoint**: Runtime and Terraform interfaces are defined.

---

## Phase 3: User Story 1 - Provision a Repeatable Hosting Environment (Priority: P1) 🎯 MVP

**Goal**: Repeated provisioning manages one reachable EC2 environment without SSH.

**Independent Test**: Run provisioning twice and verify the same instance ID/site URL and a no-change Terraform plan.

- [X] T009 [US1] Implement default VPC/subnet discovery, AL2023 image lookup, one EC2 instance, security group, and Elastic IP in infra/aws/main.tf
- [X] T010 [US1] Implement the private encrypted lifecycle-managed release bucket and scoped instance read policy in infra/aws/main.tf
- [X] T011 [US1] Implement the Systems Manager instance role/profile with no inbound SSH in infra/aws/main.tf
- [X] T012 [US1] Implement idempotent Node.js, Nginx, service-user, directory, and systemd bootstrap in infra/aws/user-data.sh
- [X] T013 [US1] Implement profile-aware STS verification plus Terraform init/plan/apply/output flow in scripts/provision.ps1

**Checkpoint**: Infrastructure can be provisioned and reconciled independently.

---

## Phase 4: User Story 2 - Deploy Application Changes Automatically (Priority: P2)

**Goal**: One owner command safely packages, transfers, activates, and verifies a release.

**Independent Test**: Deploy the same revision twice and verify one healthy service and unchanged infrastructure.

- [X] T014 [P] [US2] Implement immutable remote release download, hash verification, extraction, dependency install, symlink activation, and service restart in scripts/remote-deploy.sh
- [X] T015 [US2] Implement profile-aware tests, safe packaging exclusions, SHA-256 upload, Systems Manager execution/waiting, diagnostics, and public health polling in scripts/deploy.ps1
- [X] T016 [US2] Add deployment script contract tests for exclusions and command construction in scripts/test/deployment-scripts.test.ps1

**Checkpoint**: Code deployment is automated without interactive server access.

---

## Phase 5: User Story 3 - Preserve Club Data Across Deployments (Priority: P3)

**Goal**: Releases and restarts retain the SQLite-backed club state.

**Independent Test**: Create recognizable data, redeploy, reboot, and verify the same data remains.

- [X] T017 [US3] Configure bookclub.service to use /var/lib/bookclub/bookclub.sqlite and keep all deployment cleanup confined to /opt/bookclub/releases in infra/aws/user-data.sh
- [X] T018 [US3] Add remote deployment guards rejecting archives that contain SQLite/data paths in scripts/remote-deploy.sh
- [X] T019 [US3] Add repeat-deployment and persistence validation commands to specs/010-deploy-aws-ec2/quickstart.md

**Checkpoint**: Application data is outside the release lifecycle and explicitly validated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate safety, documentation, and operational usability across all stories.

- [X] T020 [P] Add AWS profile, IAM permission, cost, state-backup, and future domain guidance to README.md
- [X] T021 Run npm tests and PowerShell/Bash syntax checks against package.json, scripts/provision.ps1, scripts/deploy.ps1, and scripts/remote-deploy.sh
- [X] T022 Run terraform fmt -check and terraform validate for infra/aws/
- [X] T023 Run a reviewed Terraform plan with profile default and confirm the resource count/security boundaries before apply in infra/aws/
- [X] T024 Provision the environment twice and confirm one EC2 instance plus a no-change plan using scripts/provision.ps1
- [X] T025 Deploy twice, verify /health, persistent SQLite data, and reboot recovery using scripts/deploy.ps1 and specs/010-deploy-aws-ec2/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no dependencies.
- Phase 2 depends on Phase 1 and blocks every user story.
- US1 depends on Phase 2.
- US2 depends on the US1 outputs and managed instance.
- US3 depends on the deployment path from US2.
- Polish depends on all selected user stories.

### User Story Dependencies

- **US1** establishes the one-instance environment.
- **US2** consumes US1 outputs but can be tested locally through command construction before provisioning.
- **US3** strengthens US2's release boundary and is validated after deployment.

### Parallel Opportunities

- T003 and initial directory work can proceed independently.
- T005 can be written alongside Terraform interface work T006-T008.
- T014 can be implemented while US1 Terraform configuration is being completed.
- T020 can be completed alongside final local validation.

## Parallel Example: User Story 2

```text
Task: "Implement scripts/remote-deploy.sh"
Task: "Prepare scripts/test/deployment-scripts.test.ps1"
```

## Implementation Strategy

1. Complete health and Terraform contracts.
2. Build and validate the single-instance infrastructure locally.
3. Build deployment transfer and activation automation.
4. Apply database-preservation guards.
5. Review the Terraform plan before creating billable resources.
6. Provision once, rerun for idempotency, deploy twice, and validate persistence.

## Format Validation

All tasks use the required checkbox, sequential task ID, optional parallel marker, required user-story label within story phases, and an exact file path.
