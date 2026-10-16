<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
- None renamed.
Added sections:
- VI. Platform-Independent Core (new principle under Core Principles)
Removed sections:
- None.
Follow-up TODOs:
- TODO(TECHNOLOGY_STACK): No language, framework, data store, or host is
  selected. Record them in Additional Constraints once chosen. The chosen
  stack MUST keep the core free of website and mobile UI dependencies.
Rationale: MINOR bump. A new principle was added. Existing principles were
not removed or redefined. Ratification date stays 2026-10-05.
-->

# BookClub Constitution

## Core Principles

### I. Specification Before Implementation

No feature is implemented until a specification, plan, and task list exist and
describe the behavior being built. Implementation MUST follow those artifacts.
Any change to user-visible behavior MUST update the specification in the same
change.

Rationale: This repository uses Spec Kit as the source of product requirements.
Code without a spec is not an approved change.

### II. Verified Behavior

Every acceptance scenario in the active specification MUST be covered by an
automated test or by an explicit manual check named in the feature tasks. A
feature MUST NOT be treated as complete while a specified scenario is unverified.

Rationale: Specified behavior is the contract. Unverified scenarios do not meet it.

### III. Club Data Stays in the Club

Membership, reading activity, and discussion content MUST be visible only to
people the specification authorizes. Credentials and secrets MUST NOT be
committed to the repository. A feature that widens who can see club data MUST
state that change in the specification.

Rationale: Book club conversations and reading activity are private unless a
spec explicitly makes them public.

### IV. Smallest Design That Meets the Spec

Plans MUST use the simplest design that satisfies the current specification.
A new dependency, service, or abstraction MUST be justified in the plan.
Behavior that the specification does not require MUST NOT be built ahead of a
spec.

Rationale: Unused structure becomes a constraint on later features. The
platform-independent core required by Principle VI is a standing justification
and MUST be present even when the current feature ships only one client.

### V. Consistent, Recoverable Changes

A change MUST preserve existing specified behavior unless the specification
explicitly revises it. A breaking change MUST be identified in the plan and
MUST include a migration or member-communication step.

Rationale: Clubs accumulate history. Silent breakage of reading progress,
membership, or discussion history is not acceptable.

### VI. Platform-Independent Core

Club behavior MUST live in a core that a website and a mobile app can both use
without copying that behavior. Membership, books, reading activity, discussion,
and who may see club data MUST be implemented in the core. The core MUST be
testable and reusable with no website and no mobile app present.

The core MUST NOT depend on a web UI framework, a mobile UI framework, browser
APIs, or device APIs. Website and mobile code MUST stay in clients that call
the core. A business rule MUST NOT be implemented twice, once per client. If
both clients need it, it belongs in the core.

Each feature plan MUST state which behavior is core and which behavior is
specific to a website or a mobile client. Building only one client now does
not waive this split.

Rationale: The product may ship as a website, a mobile app, or both. Shared
rules stay in one place so either client can reuse them.

## Additional Constraints

- Spec Kit feature numbering is sequential.
- Runtime requirements live in the feature specification, plan, and tasks.
  There is no separate guidance file.
- Architecture MUST keep a platform-independent core plus optional website and
  mobile clients. Either client MUST be able to use the core. Neither client
  is required for the core to exist.
- TODO(TECHNOLOGY_STACK): Language, framework, data store, and hosting are not
  selected. Until they are recorded here, each feature plan MUST name the stack
  it uses and MUST NOT assume a constitutional default. Any stack that is
  chosen MUST keep the core free of website and mobile UI dependencies.

## Development Workflow

1. Change governance only by amending this constitution.
2. For each feature: specify, then plan, then write tasks, then implement.
3. The plan MUST include a check against these principles, including which
   behavior belongs in the core and which belongs in a client.
4. A change is ready for review only when the specified scenarios are
   implemented and their tests or recorded checks pass. Core behavior MUST
   have checks that run without a website or a mobile app.
5. A pull request MUST identify the specification and tasks it completes.

## Governance

This constitution outranks informal practice and feature artifacts. If a
specification, plan, or task conflicts with it, the constitution prevails until
amended.

Amendments MUST be made in `.specify/memory/constitution.md`. Each amendment
MUST bump the version and set Last Amended to the amendment date. The Ratified
date stays at the original adoption date.

Version policy:

- MAJOR: A principle is removed or redefined in a way that invalidates prior
  compliance.
- MINOR: A principle or section is added, or guidance is materially expanded.
- PATCH: Wording is clarified without changing the rule.

Compliance is reviewed when a feature is planned and again before it is
considered done. Complexity beyond Principle IV MUST be justified in the plan,
except the core boundary required by Principle VI. The Sync Impact Report
comment at the top of this file is review scratch and MUST be removed before
the amended constitution is committed.

**Version**: 1.1.0 | **Ratified**: 2026-10-05 | **Last Amended**: 2026-10-05
