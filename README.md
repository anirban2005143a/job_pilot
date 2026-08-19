# JobPilot

JobPilot is a modular job-automation backend designed to continuously collect jobs from external job sources, understand a user's resume and preferences, identify suitable opportunities, schedule applications according to user/source limits, generate application material with an LLM, submit applications through job sources, and monitor application status.

The project is organized around independent modules and asynchronous workers so that job collection, matching, scheduling, application, status checking, notifications, and recovery can operate without tightly coupling the main API server to long-running work.

---

## Table of Contents

- [1. What JobPilot Does](#1-what-jobpilot-does)
- [2. High-Level Architecture](#2-high-level-architecture)
- [3. Repository Structure](#3-repository-structure)
- [4. Core Technologies](#4-core-technologies)
- [5. End-to-End Job Lifecycle](#5-end-to-end-job-lifecycle)
- [6. Major Backend Modules](#6-major-backend-modules)
  - [6.1 API Layer](#61-api-layer)
  - [6.2 Authentication](#62-authentication)
  - [6.3 User Module](#63-user-module)
  - [6.4 Source Module](#64-source-module)
  - [6.5 Job Module](#65-job-module)
  - [6.6 Collector Module](#66-collector-module)
  - [6.7 Resume Module](#67-resume-module)
  - [6.8 LLM Module](#68-llm-module)
  - [6.9 Matching Module](#69-matching-module)
  - [6.10 Clarification Module](#610-clarification-module)
  - [6.11 Scheduler Module](#611-scheduler-module)
  - [6.12 Apply Module](#612-apply-module)
  - [6.13 Application Status Module](#613-application-status-module)
  - [6.14 Notification Module](#614-notification-module)
  - [6.15 Old Job Recovery Module](#615-old-job-recovery-module)
- [7. Queue-Based Architecture](#7-queue-based-architecture)
- [8. Data Model Overview](#8-data-model-overview)
- [9. Job Source Abstraction](#9-job-source-abstraction)
- [10. Matching and Decision Flow](#10-matching-and-decision-flow)
- [11. Scheduling and Rate Limiting](#11-scheduling-and-rate-limiting)
- [12. Application Flow](#12-application-flow)
- [13. Resume and AI Services](#13-resume-and-ai-services)
- [14. Recovery and Reliability](#14-recovery-and-reliability)
- [15. API Layer Overview](#15-api-layer-overview)
- [16. Environment Configuration](#16-environment-configuration)
- [17. Running the System](#17-running-the-system)
- [18. Running the Job Source Test Server](#18-running-the-job-source-test-server)
- [19. Running the Python AI Service](#19-running-the-python-ai-service)
- [20. Testing](#20-testing)
- [21. Design Decisions](#21-design-decisions)
- [22. Scaling Considerations](#22-scaling-considerations)
- [23. Adding a New Job Source](#23-adding-a-new-job-source)
- [24. Failure Scenarios](#24-failure-scenarios)
- [25. Current System Boundaries](#25-current-system-boundaries)
- [26. Future Extension Areas](#26-future-extension-areas)

---

# 1. What JobPilot Does

JobPilot treats automated job applications as a pipeline rather than a single request.

At a high level:

```text
Job Sources
    │
    ▼
Job Collector
    │
    ▼
Job Storage
    │
    ▼
Matching
    │
    ├── Not suitable ───────────────► Stop
    │
    ├── Needs clarification ────────► Clarification Flow
    │
    ▼
Scheduler
    │
    ▼
Apply Queue
    │
    ▼
Application Pipeline
    │
    ├── Resume / Cover Letter generation
    ├── Application submission
    └── Application record
    │
    ▼
Status Checking
    │
    ▼
Notifications
```

The important architectural idea is that each stage has a clear responsibility.

For example:

- The collector does not decide whether a job is suitable.
- Matching does not decide when an application should be submitted.
- Scheduling does not perform the actual application.
- The apply worker does not need to know how a job was originally collected.
- The API server does not have to perform every expensive operation synchronously.

This separation makes the system easier to extend and allows individual stages to be scaled independently.

---

# 2. High-Level Architecture

JobPilot currently consists of three major runtime areas.

## 2.1 Node.js Backend

The main backend is under `backend/`.

It contains:

- HTTP API
- authentication
- MongoDB access
- user and job models
- source management
- job collection
- matching orchestration
- scheduling
- application processing
- application status processing
- notifications
- recovery processing

The backend uses Express and is organized into domain-oriented modules.

## 2.2 Python AI Service

The `python_server/` directory contains a FastAPI service responsible for AI-heavy operations.

It currently exposes functionality for:

- parsing PDF resumes
- summarizing resumes
- matching users against jobs
- generating job clarification information
- generating resumes
- generating cover letters

This keeps AI/model-oriented functionality separated from the main Node.js orchestration layer.

## 2.3 Job Source Test Server

`job_source_1/` is a standalone Express-based mock job source.

It provides a controlled environment for developing and testing the source abstraction and application workflow without depending on a real job platform.

It contains:

- `jobs.json`
- `applications.json`
- `logs.txt`
- source server
- source tests

---

# 3. Repository Structure

```text
job_pilot/
│
├── backend/
│   ├── config/
│   │   └── env.js
│   │
│   ├── database/
│   │   └── MongoDatabase.js
│   │
│   ├── middleware/
│   │
│   ├── modules/
│   │   ├── apply/
│   │   ├── auth/
│   │   ├── check_status/
│   │   ├── collector/
│   │   ├── job/
│   │   ├── llm/
│   │   ├── matching/
│   │   ├── needsClarification/
│   │   ├── notification/
│   │   ├── oldJobRecovery/
│   │   ├── resume/
│   │   ├── scheduler/
│   │   ├── sources/
│   │   └── user/
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── source.route.js
│   │   └── user.routes.js
│   │
│   ├── uploads/
│   │   └── resumes/
│   │
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── readme.md
│
├── job_source_1/
│   ├── applications.json
│   ├── jobs.json
│   ├── logs.txt
│   ├── server.js
│   ├── server.test.js
│   └── package.json
│
└── python_server/
    ├── api_models/
    ├── llm/
    ├── resume_parse.ipynb
    └── server.py
```

The backend's modules are intentionally separated by business responsibility. The current repository contains dedicated modules for apply, authentication, status checking, collection, jobs, LLM interaction, matching, clarification, notifications, recovery, resumes, scheduling, sources, and users.

---

# 4. Core Technologies

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express 5 | HTTP API |
| MongoDB | Persistent application data |
| Mongoose | MongoDB modeling and access |
| Redis | Scheduling state and queue infrastructure |
| BullMQ | Background job queues and workers |
| Axios | HTTP communication with external services |
| JWT | Authentication |
| bcrypt | Password hashing |
| Zod | Request/data validation |
| Multer | Resume/file uploads |
| Helmet | HTTP security headers |
| CORS | Cross-origin request handling |
| express-rate-limit | API rate limiting |
| p-limit | Concurrency control |
| dotenv | Environment configuration |

The backend dependency set is defined in `backend/package.json`.

## AI Service

The Python service uses:

- FastAPI
- PyMuPDF
- pymupdf4llm
- structured request/response models
- LLM-specific modules

The Python service acts as a specialized AI/document-processing layer.

---

# 5. End-to-End Job Lifecycle

A typical job moves through the following lifecycle.

## Step 1 — Collection

A source is configured and enabled.

The collector communicates with the source and retrieves jobs.

The source-specific implementation is hidden behind the `JobSource` abstraction.

The collector converts external source data into the application's internal job representation.

```text
External Source
      │
      ▼
JobSource abstraction
      │
      ▼
Normalized Job
      │
      ▼
MongoDB
```

## Step 2 — Matching

New jobs are passed into the matching pipeline.

The matching stage considers the user's resume/profile and preferences and uses the AI service where appropriate.

The result determines whether the job is:

- relevant
- unsuitable
- potentially relevant but requiring clarification

## Step 3 — Clarification

Some jobs cannot be safely accepted or rejected from the available information.

The clarification pipeline provides a separate asynchronous path for these cases.

This prevents uncertain decisions from being treated as normal successful matches.

## Step 4 — Scheduling

A suitable job is not necessarily applied to immediately.

The scheduler checks:

- whether the user is active
- the user's daily application limit
- the user's previous scheduled application
- the configured application interval
- the job source's hourly limit
- already-reserved future application slots

The scheduler calculates the earliest valid time and places the application in the apply queue with a delay.

## Step 5 — Application

When the delayed job becomes available, the apply worker processes it.

The application pipeline is responsible for the actual application workflow, including the required application material and communication with the job source.

An application record is maintained so the system has a persistent representation of the attempt.

## Step 6 — Status Checking

Application status is checked asynchronously through the status queue/worker system.

This separates submission from follow-up monitoring.

## Step 7 — Notification

Important events can be sent through the notification queue.

This keeps notification delivery outside the main business pipeline.

---

# 6. Major Backend Modules

## 6.1 API Layer

The HTTP layer is centered around:

```text
backend/app.js
backend/server.js
backend/routes/
```

`app.js` is responsible for assembling the Express application and its middleware/routes.

`server.js` is responsible for starting the backend runtime and initializing the required services.

The route layer currently includes:

- authentication routes
- source routes
- user routes

The route layer should remain thin. Business logic belongs in the domain modules rather than directly inside route handlers.

---

## 6.2 Authentication

Location:

```text
backend/modules/auth/
```

Important files:

```text
auth.controller.js
auth.validation.js
```

Responsibilities include:

- user authentication
- credential validation
- password handling
- token-based authentication
- validating authentication-related input

The API routes expose the authentication functionality without coupling the HTTP layer to the underlying authentication implementation.

---

## 6.3 User Module

Location:

```text
backend/modules/user/
```

Files include:

```text
user.controller.js
user.model.js
user.validate.js
utils.js
```

The user module represents the application owner and the configuration that drives the automation system.

A user's data is important to several other modules:

```text
User
 ├── Resume
 ├── Preferences
 ├── Status
 ├── Application limits
 ├── Application counters
 └── Matching information
```

The user's active/inactive state is also used by scheduling. An inactive user is not scheduled for new applications.

---

## 6.4 Source Module

Location:

```text
backend/modules/sources/
```

Files include:

```text
JobSource.js
source.model.js
sources/
test_job_source_class.js
```

The source module is one of the most important abstraction boundaries in the system.

It separates the rest of JobPilot from platform-specific behavior.

A source has its own:

- identity
- active/inactive state
- application limits
- source-specific implementation

The rest of the backend works against the source abstraction instead of depending directly on a particular job platform.

---

## 6.5 Job Module

Location:

```text
backend/modules/job/
```

Files include:

```text
job.repository.js
job.type.js
jobClarification.model.js
jobMatch.model.js
```

The job module is responsible for representing and accessing normalized job data.

Related records include:

- jobs
- job matches
- job clarification information

The repository layer provides a clean boundary between application logic and MongoDB access.

This is especially useful because matching, scheduling, applying, and recovery all need job data but should not all implement their own database queries.

---

## 6.6 Collector Module

Location:

```text
backend/modules/collector/
```

Files:

```text
JobCollector.js
start.js
```

The collector is responsible for continuously retrieving jobs from configured job sources.

Its responsibilities are:

1. identify enabled sources
2. communicate with the source abstraction
3. retrieve jobs
4. normalize them into the application's job representation
5. persist them
6. trigger downstream processing where appropriate

The collector should not contain matching or application policy.

That separation means adding another source does not require rewriting the matching or scheduling systems.

---

## 6.7 Resume Module

Location:

```text
backend/modules/resume/
```

Files:

```text
ResumeDocument.js
extractResumeContent.js
```

The resume module handles resume representation and content extraction on the Node.js side.

The actual PDF parsing/AI processing is delegated to the Python service.

This creates a useful separation:

```text
Node.js
  │
  ├── Stores/organizes resume information
  │
  ▼
Python AI Service
  │
  ├── Parses PDF
  ├── Converts document content
  └── Performs AI processing
```

---

## 6.8 LLM Module

Location:

```text
backend/modules/llm/
```

Important file:

```text
llm.js
```

The Node.js LLM module acts as the integration boundary between backend business logic and AI functionality.

AI operations include tasks such as:

- job matching
- resume-related processing
- application content generation
- AI-assisted decisions

The architecture intentionally keeps LLM operations behind a module rather than spreading model/API calls across unrelated business modules.

---

## 6.9 Matching Module

Location:

```text
backend/modules/matching/
```

Files:

```text
MatchingPipeline.js
matching.queue.js
matching.worker.js
start.js
```

Matching is asynchronous.

The queue/worker structure allows a large number of newly collected jobs to be processed without blocking the API server or collector.

Conceptually:

```text
New Job
  │
  ▼
Matching Queue
  │
  ▼
Matching Worker
  │
  ▼
Matching Pipeline
  │
  ├── Suitable
  ├── Not Suitable
  └── Needs Clarification
```

The matching pipeline is responsible for coordinating the decision process rather than owning the entire AI implementation itself.

---

## 6.10 Clarification Module

Location:

```text
backend/modules/needsClarification/
```

Files:

```text
ClarificationPipeline.js
clarification.queue.js
clarification.worker.js
start.js
test_clarification_pipeline.js
```

This module exists for cases where a job requires additional interpretation before the system can safely continue.

Separating clarification from normal matching prevents uncertain cases from contaminating the normal application path.

It also provides a clear extension point for future user interaction.

---

## 6.11 Scheduler Module

Location:

```text
backend/modules/scheduler/
```

Files:

```text
schedulerPipeline.js
scheduler.queue.js
scheduler.worker.js
start.js
test_scheduler_pipeline.js
```

The scheduler is the central policy engine for deciding **when** an application can happen.

It does not perform the application itself.

### User-level constraints

The scheduler considers the user's:

- active/inactive state
- daily application limit
- current daily application count
- reset time
- minimum interval between scheduled applications

### Source-level constraints

The scheduler also considers the source's:

- active/inactive state
- maximum applications per hour

### Redis scheduling state

Redis is used to maintain scheduling information that must be shared across workers.

The scheduler keeps:

- the user's last scheduled time
- future source application reservations

This is important because the system must consider applications that are already scheduled but have not happened yet.

Without reservations, several workers could independently see available capacity and schedule too many applications.

### Final scheduling decision

Conceptually:

```text
User available time
        │
        ├──────────────┐
        │              │
Source available time │
        │              │
        └──────┬───────┘
               ▼
      maximum of all constraints
               │
               ▼
        final scheduled time
```

The scheduler then adds the application to the apply queue with the calculated delay.

---

## 6.12 Apply Module

Location:

```text
backend/modules/apply/
```

Files:

```text
application.model.js
apply.queue.js
apply.worker.js
applyPipeline.js
start.js
test_apply_pipeline.js
```

The apply module is responsible for executing an application after the scheduler has selected a valid time.

Its major responsibilities include:

- retrieving the required user/job/source data
- preparing application information
- generating or obtaining required application material
- communicating with the job source
- recording application state
- handling application outcomes

The important separation is:

```text
Scheduler
    = "When should this happen?"

Apply
    = "Perform the application now."
```

This allows scheduling policy to evolve independently from platform/application behavior.

---

## 6.13 Application Status Module

Location:

```text
backend/modules/check_status/
```

Files:

```text
check_status.producer.js
check_status.queue.js
check_status.worker.js
start.js
```

This is a separate asynchronous pipeline for monitoring application status.

The producer can create status-check work, while the worker processes that work independently of application submission.

Conceptually:

```text
Application Records
       │
       ▼
Status Producer
       │
       ▼
Status Queue
       │
       ▼
Status Worker
       │
       ▼
Source Status
       │
       ▼
Updated Application
```

This prevents status checking from blocking new applications.

---

## 6.14 Notification Module

Location:

```text
backend/modules/notification/
```

The notification module has its own queue infrastructure.

Notifications are intentionally separated from the main application flow so that temporary notification failures do not have to make the underlying business operation fail.

This also allows notification delivery to be changed later without changing matching, scheduling, or application logic.

---

## 6.15 Old Job Recovery Module

Location:

```text
backend/modules/oldJobRecovery/
```

Current worker:

```text
oldJobRecovery.worker.js
```

The old-job recovery mechanism addresses an important distributed-system scenario.

A job may have been collected while a user was paused/inactive. In that case, the job can exist in the database but may never have gone through the user's normal matching/application flow.

The recovery worker periodically looks back over an environment-configured historical interval and identifies jobs that need to be reprocessed for users who are now eligible.

Conceptually:

```text
Previously collected jobs
        │
        ▼
Historical window
        │
        ▼
Find users/jobs missed while paused
        │
        ▼
Re-enter normal processing
        │
        ▼
Matching → Scheduling → Apply
```

The historical window is configuration-driven rather than hard-coded, allowing the recovery period to be changed without modifying business logic.

---

# 7. Queue-Based Architecture

BullMQ is used for asynchronous processing.

The repository contains independent queue/worker pairs for multiple pipeline stages.

```text
                   ┌─────────────────┐
                   │   API Server    │
                   └────────┬────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   MongoDB     │
                    └───────────────┘

Collector
   │
   ▼
Matching Queue ──► Matching Worker
                        │
                        ▼
                 Matching Pipeline
                   │         │
                   │         └──► Clarification Queue
                   │
                   ▼
               Scheduler Queue
                   │
                   ▼
             Scheduler Worker
                   │
                   ▼
               Apply Queue
                   │
                   ▼
               Apply Worker
                   │
                   ▼
             Application Data
                   │
                   ▼
             Status Queue
                   │
                   ▼
             Status Worker
                   │
                   ▼
            Notification Queue
```

The exact runtime composition can be started as separate processes.

This architecture gives the system:

- isolation between workloads
- retry capability through queue infrastructure
- better failure handling
- independent scaling
- non-blocking HTTP requests
- controlled concurrency

---

# 8. Data Model Overview

The backend uses MongoDB through Mongoose.

The major conceptual entities are:

```text
User
 │
 ├──────── Resume
 │
 ├──────── Preferences
 │
 ├──────── Job Matches
 │
 └──────── Applications
              │
              └──── Job
                     │
                     └──── Source
```

## User

Contains identity and automation-related information such as:

- account information
- status
- resume/profile data
- preferences
- application limits
- application counters
- reset information

## Source

Represents an external job provider.

A source can be activated/deactivated and can define source-level application limits.

## Job

Represents a normalized job independent of the original platform's format.

A job is associated with a source.

## Job Match

Represents the relationship between a user and a job after the matching stage.

This keeps matching information separate from the original job.

## Job Clarification

Stores information related to jobs that require clarification before the normal application pipeline can continue.

## Application

Represents an application attempt made by a user for a job.

Application data is separate from the job itself because one job can potentially be considered/applied to by many users.

---

# 9. Job Source Abstraction

One of the key extensibility decisions in JobPilot is the source abstraction.

Instead of implementing platform-specific logic throughout the backend, a source implements the expected interface represented by:

```text
backend/modules/sources/JobSource.js
```

A source is responsible for understanding its own external API/data format.

The rest of JobPilot expects normalized job information.

```text
                JobPilot
                   │
            JobSource interface
          ┌────────┴─────────┐
          │                  │
      Source A           Source B
          │                  │
   platform API        platform API
```

This provides two major benefits.

### Adding a source

A new source can be introduced without rewriting:

- matching
- scheduling
- application orchestration
- job storage
- status processing

### Testing

The standalone `job_source_1` service can simulate a real source, allowing the rest of the backend to be tested against a predictable environment.

---

# 10. Matching and Decision Flow

Matching is intentionally separated from scheduling.

A simplified decision process is:

```text
Job
 │
 ├── User resume/profile
 │
 ├── User preferences
 │
 └── Job requirements
          │
          ▼
      AI Matching
          │
     ┌────┼──────────────┐
     │    │              │
     ▼    ▼              ▼
 Reject  Match      Clarification
                    Required
```

A match does not mean "apply immediately."

It only means that the job is eligible to proceed.

The scheduler then applies operational constraints before an application can happen.

This distinction is important because:

```text
Match decision
    ≠
Application decision/time
```

A user may match many jobs, while their configured limits allow only a small number of applications per day.

---

# 11. Scheduling and Rate Limiting

Scheduling is designed around multiple independent constraints.

## 11.1 User daily limit

A user can define a maximum number of applications per day.

When the daily limit is reached, newly scheduled applications are moved to the next reset period.

## 11.2 User application interval

The scheduler maintains a minimum interval between applications for a user.

This avoids sending many applications at exactly the same time.

The default interval can be configured through the environment.

## 11.3 Source hourly limit

A job source can define a maximum number of applications per hour.

The scheduler maintains future source reservations in Redis so that scheduled applications count toward the source's capacity.

## 11.4 Combined constraint

The final time is effectively:

```text
finalTime =
    max(
        currentTime,
        userNextAvailableTime,
        sourceNextAvailableTime
    )
```

This design prevents one user's schedule from violating either their own constraints or the source's global limits.

---

# 12. Application Flow

Once the scheduler has selected a time:

```text
Scheduled Apply Job
       │
       ▼
Apply Queue
       │
       ▼
Apply Worker
       │
       ▼
Apply Pipeline
       │
       ├── Load user
       ├── Load job
       ├── Load source
       ├── Prepare application data
       ├── Generate/use resume material
       ├── Generate/use cover letter
       ├── Submit to source
       └── Persist application result
```

The actual source-specific submission is delegated to the source implementation.

This keeps the application pipeline generic.

---

# 13. Resume and AI Services

The Python service provides a specialized API layer for AI/document operations.

## PDF parsing

The `/parse` endpoint accepts a PDF resume and converts it into Markdown-oriented content.

The service validates the upload, processes the PDF, and removes its temporary file after processing.

## Resume summarization

The `/summarize-resume` endpoint receives resume content and optional user instructions and returns a structured summary.

## Job matching

The `/match-job` endpoint receives user information and job information and returns a structured matching result.

## Job clarification

The `/clarify-job` endpoint generates structured clarification information using:

- user data
- user preferences
- job data
- matching result

## Resume generation

The `/create-resume` endpoint generates a resume based on:

- user information
- existing resume data
- job information
- optional user instructions

## Cover letter generation

The `/create-cover-letter` endpoint generates a cover letter using:

- user information
- resume
- target job
- optional instructions

This service architecture keeps model-specific code away from the main Node.js request/queue orchestration.

---

# 14. Recovery and Reliability

JobPilot contains several mechanisms intended to keep asynchronous processing reliable.

## Queue isolation

Every major asynchronous stage has its own queue and worker.

A failure in one stage does not require the entire backend to stop.

## Persistent state

Important business state is stored in MongoDB rather than only in process memory.

This allows workers to reconstruct state after a restart.

## Redis scheduling state

Scheduling information is stored in Redis so that multiple worker processes can coordinate.

## Old-job recovery

Jobs missed because a user was inactive can be reconsidered later.

This avoids permanently losing opportunities due to a temporary user state.

## Application state

Applications are represented independently from jobs, allowing their status to be updated after submission.

---

# 15. API Layer Overview

The main route groups are:

```text
/auth
/source
/user
```

The exact endpoint paths and request schemas should be treated as part of the route files rather than duplicated in business modules.

The API layer primarily handles:

1. receiving HTTP requests
2. validating input
3. authenticating users
4. invoking the appropriate module
5. returning HTTP responses

Long-running work should be delegated to the asynchronous pipelines.

---

# 16. Environment Configuration

Environment-specific behavior is centralized through:

```text
backend/config/env.js
```

The repository uses environment variables for configuration such as:

- database connection information
- Redis connection information
- authentication secrets
- external service URLs
- AI service configuration
- queue/application configuration
- application intervals
- old-job recovery interval
- other runtime limits

Sensitive values should never be committed to source control.

A deployment should provide its own environment configuration.

## Important configuration concept

Some behavior that affects scheduling/recovery is intentionally configurable.

For example:

```text
DEFAULT_APPLICATION_INTERVAL_MINUTES
```

controls the default spacing between scheduled applications.

The old-job recovery window is also intended to come from environment configuration rather than being permanently fixed in code.

Because environment names can evolve with the implementation, always use the current `backend/config/env.js` as the authoritative list of supported variables.

---

# 17. Running the System

## Prerequisites

You should have:

- Node.js
- npm
- MongoDB
- Redis
- Python 3.x
- a configured LLM provider/service
- access to the job source you want to test against

For local development, the mock job source can be used instead of a real external platform.

---

## Backend

```bash
cd backend
npm install
```

Create the appropriate environment configuration for your local setup.

Then start the backend using the project's server entry point.

```bash
node server.js
```

The backend should have access to:

- MongoDB
- Redis
- Python AI service
- any configured job source

---

## Worker Processes

Because the system uses independent workers, queue consumers can be started separately from the API server.

The repository contains `start.js` entry points for the major asynchronous modules.

Typical worker groups include:

```text
collector
matching
scheduler
apply
check_status
needsClarification
```

The exact deployment topology can be changed depending on scale.

For development, workers can be run as separate Node processes.

For production, each worker group can be managed independently by a process manager/container/orchestrator.

---

# 18. Running the Job Source Test Server

The mock source is located at:

```text
job_source_1/
```

Install its dependencies:

```bash
cd job_source_1
npm install
```

Start the server using its configured Node entry point.

The test source maintains:

```text
jobs.json
applications.json
logs.txt
```

This provides a simple persistent test environment for:

- job fetching
- application submission
- application state
- request logging

The repository also contains:

```text
server.test.js
```

for testing the source behavior.

---

# 19. Running the Python AI Service

The AI service is under:

```text
python_server/
```

It is a FastAPI application.

Install the required Python dependencies in your Python environment, then start the FastAPI application using the project's configured ASGI entry point.

Conceptually:

```bash
cd python_server
uvicorn server:app --reload
```

The service provides endpoints including:

```text
GET  /
POST /parse
POST /summarize-resume
POST /match-job
POST /clarify-job
POST /create-resume
POST /create-cover-letter
```

The root endpoint can be used as a basic health check.

---

# 20. Testing

The repository includes tests for important business pipelines.

Current test areas include:

```text
backend/modules/apply/test_apply_pipeline.js
backend/modules/matching/...
backend/modules/scheduler/test_scheduler_pipeline.js
backend/modules/needsClarification/test_clarification_pipeline.js
backend/modules/sources/test_job_source_class.js
job_source_1/server.test.js
```

The test strategy focuses on validating domain pipelines independently rather than requiring the entire system to be running for every test.

This is especially useful for scheduling and application logic, where edge cases are important.

Recommended test categories include:

### Unit tests

Validate individual pieces of business logic.

### Pipeline tests

Validate the sequence of operations inside a module.

### Source tests

Validate that a job source conforms to the source contract.

### Integration tests

Validate interactions between:

```text
MongoDB
Redis
queues
workers
Python service
job source
```

---

# 21. Design Decisions

## Modular architecture

The project is organized by business domain rather than putting everything into controllers/services.

This makes ownership clearer.

## Queue-first asynchronous processing

Job collection, matching, scheduling, application, status checking, clarification, and notifications can run asynchronously.

This prevents long-running work from blocking HTTP requests.

## Source abstraction

External job platforms are treated as interchangeable implementations.

This is essential because each job platform has different APIs and application mechanisms.

## Separate AI service

AI/document processing is isolated in Python.

This allows the AI stack to evolve independently from the Node.js backend.

## MongoDB for durable business state

MongoDB stores entities that need to survive worker restarts and application restarts.

## Redis for coordination

Redis is used for fast, temporary coordination state and queue infrastructure.

Scheduling is a particularly important use case because multiple workers need to see the same scheduling reservations.

## Scheduler separated from Apply

This is one of the most important architectural boundaries.

The scheduler decides **when**.

The apply pipeline decides **how**.

This makes both components independently replaceable.

## Recovery as a first-class feature

The old-job recovery worker acknowledges that users and workers can be temporarily unavailable or inactive.

Instead of treating missed processing as permanent loss, the system can reprocess historical jobs.

---

# 22. Scaling Considerations

The architecture is designed to scale horizontally.

## API scaling

Multiple API server instances can run behind a load balancer because durable state is stored externally.

## Worker scaling

Worker counts can be increased independently.

For example:

```text
10,000 matching jobs
```

does not require increasing the number of API servers.

Instead, matching workers can be scaled.

## Queue isolation

If matching becomes the bottleneck, only matching workers need to scale.

If applications become the bottleneck, apply workers can be scaled independently.

## Redis coordination

Scheduling state must remain shared between worker instances.

This is why scheduling state is stored in Redis rather than in local variables.

## MongoDB indexes

As job volume increases, indexes become increasingly important for queries such as:

- jobs by source
- jobs by creation/fetch time
- jobs by status
- job matches by user
- applications by user
- applications by status
- historical recovery queries

---

# 23. Adding a New Job Source

The source abstraction is designed to make this straightforward.

## Step 1 — Create a source implementation

Add the new platform implementation under:

```text
backend/modules/sources/sources/
```

The implementation should conform to the `JobSource` contract.

## Step 2 — Normalize jobs

Convert the platform-specific response into the internal job representation.

The rest of JobPilot should not need to know about platform-specific field names.

## Step 3 — Implement application behavior

The source must provide the behavior required by the apply pipeline to submit an application.

## Step 4 — Implement status behavior

If the source supports application-status checking, provide the required source behavior for the status pipeline.

## Step 5 — Register/configure the source

Create the corresponding source record/configuration and define its limits.

## Step 6 — Test against the source contract

Use the existing source tests as a model.

The goal is that:

```text
Collector
Matching
Scheduler
Apply
Status
```

continue working without source-specific changes.

---

# 24. Failure Scenarios

## User becomes inactive

The scheduler checks the user's current status before scheduling.

An inactive user should not receive new application scheduling.

Previously collected jobs can later be considered by the old-job recovery mechanism after the user becomes eligible again.

## Source becomes inactive

The scheduler checks source state before scheduling.

An inactive source should not receive new applications.

## Matching worker fails

The matching job remains part of asynchronous processing and can be retried/reprocessed according to the queue configuration.

## Apply worker fails

The application stage is isolated from matching and collection.

The queue system provides a controlled mechanism for retrying failed work.

## Notification fails

Notification is separated from the business operation, so notification delivery does not have to become the source of truth for application state.

## Backend restarts

Durable state is stored in MongoDB.

Queue/scheduling coordination is stored in Redis.

Workers can therefore resume processing without relying on process-local state.

## User pauses automation

New scheduling is blocked by user status.

Historical recovery can later identify jobs that were collected during the paused period.

---

# 25. Current System Boundaries

The current repository is primarily a backend/automation system.

The root repository currently contains:

- the Node.js backend
- the Python AI service
- a mock job source

The frontend/client application is not part of the current repository structure.

The system is also intentionally dependent on external infrastructure:

```text
MongoDB
Redis
LLM/AI service
Job source(s)
```

These are runtime dependencies rather than being embedded into the repository.

---

# 26. Future Extension Areas

The current architecture leaves clear extension points for future development.

## More job sources

Because of the `JobSource` abstraction, additional platforms can be integrated without changing the core pipeline.

## More AI providers

The AI service can be extended to support additional models/providers while keeping the Node.js business modules relatively stable.

## Smarter matching

The matching stage can evolve from simple rule/LLM-based decisions toward richer ranking systems without changing scheduling.

## Better user clarification

The clarification pipeline can later be connected to a frontend or notification system so users can answer questions and allow a paused job to continue.

## Advanced scheduling

The scheduler can be extended with:

- working hours
- timezone-aware scheduling
- per-source preferences
- company-specific limits
- daily time windows
- randomized delays
- priority queues
- per-role limits

## Application analytics

Application records provide the foundation for analytics such as:

- applications per day
- source success rate
- match-to-application rate
- application response rate
- interview rate
- source performance

## Distributed deployment

The current queue-based architecture can be deployed as separate services:

```text
API
Collector Workers
Matching Workers
Scheduler Workers
Apply Workers
Status Workers
Notification Workers
Recovery Worker
AI Service
```

Each service can then be scaled according to workload.

---

# Architecture Summary

The most important way to understand JobPilot is to view it as a set of cooperating pipelines rather than one large backend.

```text
                         ┌─────────────────────┐
                         │    Job Sources      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │     Collector       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      MongoDB        │
                         │ Jobs / Users / Apps │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Matching Queue      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Matching Worker     │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
                 Reject          Match         Clarification
                                    │                │
                                    │                ▼
                                    │       Clarification Queue
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Scheduler Queue     │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Scheduler Worker    │
                         │                     │
                         │ User limits         │
                         │ Source limits       │
                         │ Application interval│
                         │ Redis reservations  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Apply Queue         │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Apply Worker        │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Application Record  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Status Queue/Worker │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Notification Queue  │
                         └─────────────────────┘


              ┌─────────────────────────────────────┐
              │          Python AI Service          │
              │                                     │
              │ PDF Parsing                         │
              │ Resume Summarization                │
              │ Job Matching                        │
              │ Job Clarification                   │
              │ Resume Generation                   │
              │ Cover Letter Generation             │
              └─────────────────────────────────────┘
```

The architecture is therefore built around four core principles:

1. **Separate business responsibilities into modules.**
2. **Move long-running work into queues and workers.**
3. **Hide external job platforms behind a common source abstraction.**
4. **Keep AI processing separate from the main Node.js orchestration layer.**

Together, these choices make JobPilot easier to reason about, test, extend, recover, and scale.
