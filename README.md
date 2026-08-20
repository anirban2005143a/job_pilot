# JobPilot

JobPilot is a modular job-automation platform designed to continuously collect jobs from external job sources, understand a user's resume and preferences, identify suitable opportunities, schedule applications according to user/source limits, generate application material with an LLM, submit applications through job sources, and monitor application status.

The system is organized around independent modules and asynchronous workers so that job collection, matching, scheduling, application, status checking, notifications, clarification, and recovery can operate without tightly coupling long-running work to the main API server.

---

## 1. What JobPilot Does

JobPilot treats automated job applications as a pipeline rather than a single request.

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

The important architectural boundaries are:

- The collector does not decide whether a job is suitable.
- Matching does not decide when an application should be submitted.
- Scheduling does not perform the actual application.
- The apply worker does not need to know how a job was originally collected.
- The API server does not have to perform expensive operations synchronously.

---

# 2. High-Level Architecture

JobPilot currently consists of three main runtime areas plus supporting infrastructure.

### Node.js Backend

`backend/` contains:

- HTTP API
- Authentication
- MongoDB access
- User and job models
- Source management
- Job collection
- Matching orchestration
- Scheduling
- Application processing
- Application status processing
- Notifications
- Recovery processing

The backend uses Express and is organized into domain-oriented modules.

### Frontend

`frontend/` contains the Next.js/React web application used to interact with JobPilot.

It provides the user-facing layer for areas such as:

- Authentication
- Dashboard/job views
- Applied jobs
- Clarifications
- User interaction with the backend API

The frontend communicates with the Node.js API rather than directly communicating with individual workers.

### Python AI Service

`python_server/` contains a FastAPI service responsible for AI-heavy and document-processing operations.

It currently exposes functionality for:

- PDF resume parsing
- Resume summarization
- Job matching
- Job clarification generation
- Resume generation
- Cover-letter generation

### Job Source Test Server

`job_source_1/` is a standalone Express-based mock job source.

It provides a controlled environment for developing and testing the source abstraction and application workflow without depending on a real job platform.

---

# 3. Repository Structure

```text
job_pilot/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── .env.local.example
│   └── package.json
│
├── backend/
│   ├── config/
│   │   └── env.js
│   ├── database/
│   │   └── MongoDatabase.js
│   ├── middleware/
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
│   ├── routes/
│   ├── uploads/
│   │   └── resumes/
│   ├── app.js
│   ├── server.js
│   └── package.json
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

The backend is intentionally separated by business responsibility.

---

# 4. Core Technologies

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express 5 | HTTP API |
| MongoDB | Persistent application data |
| Mongoose | MongoDB modeling/access |
| Redis | Scheduling state and queue infrastructure |
| BullMQ | Background queues/workers |
| Axios | HTTP communication |
| JWT | Authentication |
| bcrypt | Password hashing |
| Zod | Validation |
| Multer | Resume/file uploads |
| Helmet | HTTP security headers |
| CORS | Cross-origin handling |
| express-rate-limit | API rate limiting |
| p-limit | Concurrency control |
| dotenv | Environment configuration |
| Next.js / React | Frontend |
| FastAPI | Python AI service |
| PyMuPDF / pymupdf4llm | PDF processing |

---

# 5. End-to-End Job Lifecycle

This is the core JobPilot flow.

## Step 1 — Collection

A source is configured and enabled.

The collector communicates with the source through the `JobSource` abstraction, retrieves jobs, normalizes them into the application's internal representation, stores them in MongoDB, and triggers downstream processing where appropriate.

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

The collector is not responsible for matching or application policy.

---

## Step 2 — Matching

New jobs enter the matching pipeline.

The matching stage considers:

- User resume/profile
- User preferences
- Job requirements
- AI matching

The result determines whether the job is:

```text
Relevant
Not suitable
Potentially relevant → Needs clarification
```

A match does **not** mean "apply immediately."

It means the job is eligible to proceed to scheduling.

---

## Step 3 — Clarification

Some jobs cannot safely be accepted or rejected from the available information.

Those jobs enter the clarification pipeline.

```text
Matching
   │
   └── Needs clarification
             │
             ▼
      Clarification Queue
             │
             ▼
      Clarification Worker
```

This keeps uncertain decisions separate from the normal application path and provides a clear extension point for user interaction.

---

## Step 4 — Scheduling

A suitable job is not necessarily applied immediately.

The scheduler checks:

- Whether the user is active
- User daily application limit
- User's current daily application count
- User reset time
- Minimum interval between applications
- Whether the source is active
- Source hourly application limit
- Already-reserved future application slots

The scheduler calculates the earliest valid time and places the application in the apply queue with a delay.

```text
Matched Job
    │
    ▼
Scheduler
    │
    ├── User constraints
    ├── Source constraints
    └── Redis reservations
    │
    ▼
Final scheduled time
    │
    ▼
Apply Queue (delayed)
```

---

## Step 5 — Application

When the delayed job becomes available, the apply worker processes it.

The application pipeline:

1. Loads the required user/job/source data.
2. Prepares application information.
3. Generates or obtains required application material.
4. Communicates with the selected job source.
5. Records the application outcome.

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
Application Pipeline
       │
       ├── Load user
       ├── Load job
       ├── Load source
       ├── Prepare application data
       ├── Resume / cover letter
       ├── Submit to source
       └── Persist application result
```

The source-specific submission behaviour is delegated to the source implementation.

---

## Step 6 — Status Checking

Application submission and application monitoring are separate.

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
Job Source
       │
       ▼
Updated Application
```

This allows status checking to run independently of new applications.

---

## Step 7 — Notifications

Important events can enter the notification queue.

Notification delivery is intentionally separated from the main business pipeline so a notification problem does not have to become the source of truth for application state.

---

# 6. Major Backend Modules

## 6.1 API Layer

Location:

```text
backend/app.js
backend/server.js
backend/routes/
```

`app.js` assembles the Express application, middleware, and routes.

`server.js` starts the backend runtime and initializes required services.

Current route groups include:

```text
/auth
/source
/user
```

Routes should remain relatively thin; domain modules contain business logic.

---

## 6.2 Authentication

Location:

```text
backend/modules/auth/
```

Main responsibilities:

- Authentication
- Credential validation
- Password handling
- Token-based authentication
- Authentication input validation

---

## 6.3 User Module

Location:

```text
backend/modules/user/
```

The user module represents the owner of the automation configuration.

User information affects:

```text
User
 ├── Resume
 ├── Preferences
 ├── Status
 ├── Application limits
 ├── Application counters
 └── Matching information
```

The user's active/inactive state is also used by scheduling.

---

## 6.4 Source Module

Location:

```text
backend/modules/sources/
```

Important files:

```text
JobSource.js
source.model.js
sources/
```

The source abstraction separates JobPilot from platform-specific behaviour.

A source has its own:

- Identity
- Active/inactive state
- Application limits
- Source-specific implementation

The rest of the backend works through the abstraction instead of depending directly on a specific platform.

---

## 6.5 Job Module

Location:

```text
backend/modules/job/
```

Important pieces include:

```text
job.repository.js
job.type.js
jobClarification.model.js
jobMatch.model.js
```

The job module represents normalized job data and related records:

- Jobs
- Job matches
- Job clarification information

The repository layer provides a boundary between application logic and MongoDB access.

---

## 6.6 Collector Module

Location:

```text
backend/modules/collector/
```

Important files:

```text
JobCollector.js
start.js
```

Responsibilities:

1. Identify enabled sources.
2. Communicate with the source abstraction.
3. Retrieve jobs.
4. Normalize jobs.
5. Persist them.
6. Trigger downstream processing where appropriate.

It does not own matching or application policy.

---

## 6.7 Resume Module

Location:

```text
backend/modules/resume/
```

The Node side manages resume representation and extraction/orchestration.

PDF parsing and AI-heavy processing are delegated to Python.

```text
Node.js
   │
   ├── Resume storage/organization
   │
   ▼
Python AI Service
   ├── PDF parsing
   ├── Document processing
   └── AI processing
```

---

## 6.8 LLM Module

Location:

```text
backend/modules/llm/
```

This module acts as the Node-side integration boundary for AI operations.

It keeps LLM/model-specific logic from spreading across unrelated business modules.

---

## 6.9 Matching Module

Location:

```text
backend/modules/matching/
```

Important files:

```text
MatchingPipeline.js
matching.queue.js
matching.worker.js
start.js
```

The matching stage is asynchronous.

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

---

## 6.10 Clarification Module

Location:

```text
backend/modules/needsClarification/
```

Important files:

```text
ClarificationPipeline.js
clarification.queue.js
clarification.worker.js
start.js
```

It provides the asynchronous path for jobs requiring additional interpretation.

---

## 6.11 Scheduler Module

Location:

```text
backend/modules/scheduler/
```

Important files:

```text
schedulerPipeline.js
scheduler.queue.js
scheduler.worker.js
start.js
```

The scheduler is the policy engine for deciding **when** an application can happen.

### User constraints

- Active/inactive state
- Daily application limit
- Current daily application count
- Reset time
- Minimum interval between scheduled applications

### Source constraints

- Active/inactive state
- Maximum applications per hour

### Redis scheduling state

Redis maintains shared scheduling information such as:

- User's last scheduled time
- Future source application reservations

Reservations matter because scheduled-but-not-yet-executed applications must count toward source capacity.

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
       Maximum of constraints
               │
               ▼
        Final scheduled time
```

The scheduler then adds the application to the apply queue with the calculated delay.

---

## 6.12 Apply Module

Location:

```text
backend/modules/apply/
```

Important files:

```text
application.model.js
apply.queue.js
apply.worker.js
applyPipeline.js
start.js
```

Responsibilities include:

- Loading user/job/source data
- Preparing application information
- Generating/obtaining application material
- Communicating with the job source
- Recording application state
- Handling application outcomes

The architectural distinction is:

```text
Scheduler = "When should this happen?"

Apply     = "Perform the application now."
```

---

## 6.13 Application Status Module

Location:

```text
backend/modules/check_status/
```

Important files:

```text
check_status.producer.js
check_status.queue.js
check_status.worker.js
start.js
```

This is an independent asynchronous pipeline for monitoring submitted applications.

---

## 6.14 Notification Module

Location:

```text
backend/modules/notification/
```

The notification system has its own queue infrastructure.

This isolates delivery failures from the core job/application state.

---

## 6.15 Old Job Recovery Module

Location:

```text
backend/modules/oldJobRecovery/
```

Worker:

```text
oldJobRecovery.worker.js
```

A job may have been collected while a user was paused/inactive. It can therefore exist in MongoDB without having gone through that user's normal matching/application flow.

The recovery worker periodically looks back over a configured historical interval and identifies jobs that should be reprocessed for users who are now eligible.

```text
Previously collected jobs
        │
        ▼
Historical window
        │
        ▼
Find missed user/job combinations
        │
        ▼
Re-enter normal processing
        │
        ▼
Matching → Scheduling → Apply
```

The historical window is configuration-driven.

---

# 7. Queue-Based Architecture

BullMQ + Redis are used for asynchronous processing.

```text
Collector
   │
   ▼
Matching Queue ──► Matching Worker
                       │
                       ▼
                 Matching Pipeline
                    │        │
                    │        └──► Clarification Queue
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

This architecture provides:

- Workload isolation
- Retry capability
- Failure containment
- Independent scaling
- Non-blocking HTTP requests
- Controlled concurrency

---

# 8. Data Model Overview

MongoDB is the durable source of truth for important business state.

Conceptually:

```text
User
 │
 ├── Resume
 ├── Preferences
 ├── Job Matches
 └── Applications
          │
          └── Job
               │
               └── Source
```

### User

Contains account and automation information such as status, resume/profile, preferences, limits, and counters.

### Source

Represents an external job provider and its configuration/limits.

### Job

Represents a normalized job independent of the original platform format.

### Job Match

Represents the relationship between a user and a job after matching.

### Job Clarification

Stores information for jobs requiring clarification.

### Application

Represents an application attempt.

Applications are separate from jobs because the same job can potentially be considered by multiple users.

---

# 9. Job Source Abstraction

One of the most important design decisions is the `JobSource` abstraction:

```text
backend/modules/sources/JobSource.js
```

A source understands its own external API/data format, while the rest of JobPilot expects normalized job/application behaviour.

```text
                 JobPilot
                    │
              JobSource contract
             ┌──────┴──────┐
             ▼             ▼
         Source A       Source B
             │             │
       Platform API   Platform API
```

Adding a new source should not require rewriting:

- Matching
- Scheduling
- Application orchestration
- Job storage
- Status processing

The standalone `job_source_1` service exists specifically to provide a predictable source implementation for development/testing.

---

# 10. Matching and Decision Flow

Matching uses:

- Job
- User resume/profile
- User preferences
- Job requirements
- AI matching

```text
Job
 │
 ├── User resume/profile
 ├── User preferences
 └── Job requirements
          │
          ▼
      AI Matching
          │
     ┌────┼──────────────┐
     ▼    ▼              ▼
  Reject Match      Clarification
                       Required
```

The key distinction is:

```text
Match decision
      ≠
Application decision/time
```

A user can match many jobs while their scheduling limits allow only a smaller number of applications.

---

# 11. Scheduling and Rate Limiting

Scheduling combines several independent constraints.

### User daily limit

A user can have a maximum number of applications per day.

When that limit is reached, applications are moved toward the next valid reset period.

### User application interval

A minimum interval is maintained between applications for a user.

### Source hourly limit

A source can define a maximum number of applications per hour.

Future source reservations are maintained in Redis so scheduled applications count against the source's capacity.

### Combined decision

Conceptually:

```text
finalTime =
    max(
        currentTime,
        userNextAvailableTime,
        sourceNextAvailableTime
    )
```

This prevents scheduling from violating either user-level or source-level constraints.

---

# 12. Application Flow

Once the scheduler selects a time:

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
       ├── Generate/use resume
       ├── Generate/use cover letter
       ├── Submit to source
       └── Persist application result
```

The actual source-specific submission is delegated to the source implementation.

---

# 13. Resume and AI Services

The Python service is the specialized AI/document-processing layer.

Current endpoints include:

```text
GET  /
POST /parse
POST /summarize-resume
POST /match-job
POST /clarify-job
POST /create-resume
POST /create-cover-letter
```

### PDF parsing

`/parse` processes an uploaded resume PDF.

### Resume summarization

`/summarize-resume` produces structured resume information.

### Job matching

`/match-job` receives user/job information and returns structured matching information.

### Job clarification

`/clarify-job` generates clarification information using user data, preferences, job data, and matching information.

### Resume generation

`/create-resume` generates job-specific resume material.

### Cover-letter generation

`/create-cover-letter` generates a cover letter using user, resume, and job information.

The Node.js backend remains responsible for orchestration; the Python service specializes in AI/document operations.

---

# 14. Frontend ↔ Backend Communication

The frontend does **not** need to communicate directly with every worker.

The communication model is:

```text
Frontend
   │
   │ HTTP
   ▼
Node API
   │
   ├── Immediate API work
   │
   └── Long-running work
          │
          ▼
       BullMQ
          │
          ▼
        Worker
          │
          ▼
       MongoDB
          │
          ▼
Frontend reads updated state
```

This means the frontend remains a normal web client while the backend handles asynchronous processing internally.

---

# 15. Environment Configuration

Backend configuration is centralized through:

```text
backend/config/env.js
```

Configuration covers areas such as:

- MongoDB
- Redis
- Authentication
- External service URLs
- Python/AI service
- Queue/application configuration
- Application intervals
- Recovery interval
- Runtime limits

Sensitive values should never be committed.

Use the current `backend/config/env.js` as the authoritative list of supported environment variables.

An important scheduling setting is:

```text
DEFAULT_APPLICATION_INTERVAL_MINUTES
```

The old-job recovery window is also configurable.

### Frontend

Copy:

```text
frontend/.env.local.example
```

to:

```text
frontend/.env.local
```

The frontend API URL should point to the Node backend, for example:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

# 16. Running the System

## Prerequisites

Install/configure:

- Node.js
- npm
- MongoDB
- Redis
- Python 3.x
- Python dependencies
- Configured LLM/AI provider
- A real job source, or use `job_source_1`

---

## 16.1 Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server normally runs on:

```text
http://localhost:3000
```

---

## 16.2 Start Node Backend

```bash
cd backend
npm install
npx nodemon server.js
```

Or, using the repository's normal Node entry point:

```bash
node server.js
```

The backend must be able to reach:

- MongoDB
- Redis
- Python AI service
- Configured job sources

---

## 16.3 Start Python AI Service

```bash
cd python_server
uvicorn server:app --reload
```

The Python service provides the AI/document endpoints described above.

---

## 16.4 Start Mock Job Source

```bash
cd job_source_1
npm install
npm run dev
```

The mock source maintains:

```text
jobs.json
applications.json
logs.txt
```

It can be used for:

- Job fetching
- Application submission
- Application state
- Request logging

---

# 17. Starting the Workers

The workers are independent Node processes.

Open separate terminals from the `backend` directory.

### Collector

```bash
cd backend
npx nodemon modules/collector/start.js
```

### Matching

```bash
cd backend
npx nodemon modules/matching/start.js
```

### Needs Clarification

```bash
cd backend
npx nodemon modules/needsClarification/start.js
```

### Scheduler

```bash
cd backend
npx nodemon modules/scheduler/start.js
```

### Apply

```bash
cd backend
npx nodemon modules/apply/start.js
```

### Status Checking

```bash
cd backend
npx nodemon modules/check_status/start.js
```

### Notification

```bash
cd backend
npx nodemon modules/notification/start.js
```

### Old Job Recovery

The current recovery module exposes:

```bash
cd backend
npx nodemon modules/oldJobRecovery/oldJobRecovery.worker.js
```

For a development setup, these can be separate terminals. In deployment, they can be managed by containers/process managers/orchestration.

---

# 18. Recommended Local Runtime

A complete local environment consists of:

```text
MongoDB
Redis

Frontend
Node API
Python AI Service
Job Source

Collector
Matching Worker
Clarification Worker
Scheduler Worker
Apply Worker
Status Worker
Notification Worker
Recovery Worker
```

A practical development terminal layout:

```text
Terminal 1   frontend
Terminal 2   backend API
Terminal 3   python AI service
Terminal 4   mock job source

Terminal 5   collector
Terminal 6   matching
Terminal 7   clarification
Terminal 8   scheduler
Terminal 9   apply
Terminal 10  status
Terminal 11  notification
Terminal 12  recovery
```

---

# 19. Testing

Important pipeline/source tests include:

```text
backend/modules/apply/test_apply_pipeline.js
backend/modules/scheduler/test_scheduler_pipeline.js
backend/modules/needsClarification/test_clarification_pipeline.js
backend/modules/sources/test_job_source_class.js
job_source_1/server.test.js
```

The project can be tested at multiple levels.

### Unit tests

Validate individual business rules.

### Pipeline tests

Validate a complete module pipeline.

### Source tests

Validate that a source follows the `JobSource` contract.

### Integration tests

Validate interactions among:

```text
MongoDB
Redis
Queues
Workers
Python service
Job sources
```

---

# 20. Reliability and Recovery

### Queue isolation

Major asynchronous stages have separate queues/workers.

A failure in one stage does not require the whole backend to stop.

### Persistent state

Important business state is stored in MongoDB rather than only in process memory.

### Redis coordination

Redis provides queue infrastructure and shared scheduling state.

### Old-job recovery

Jobs missed while a user was inactive can later be reconsidered.

### Application state

Applications are separate from jobs, allowing status to change after submission.

---

# 21. Adding a New Job Source

This is one of the most important extension workflows in JobPilot.

## Step 1 — Create the source implementation

Add the new implementation under:

```text
backend/modules/sources/sources/
```

It should conform to the `JobSource` contract defined by:

```text
backend/modules/sources/JobSource.js
```

---

## Step 2 — Normalize jobs

Every external source can have a different response format.

Convert that platform-specific response into JobPilot's normalized job representation.

The collector and downstream modules should not care about the source's original field names.

---

## Step 3 — Implement application behaviour

The source implementation should provide the behaviour required by the generic apply pipeline to submit an application.

Do not add source-specific conditions throughout the apply worker.

Avoid designs such as:

```text
if source == A
if source == B
if source == C
```

The source abstraction should handle platform-specific behaviour.

---

## Step 4 — Implement status behaviour

If the platform supports application status checking, implement the required source behaviour for the status pipeline.

---

## Step 5 — Register/configure the source

The source needs to be registered/configured so the backend can resolve the configured implementation.

The current repository's backend uses the source abstraction and source registry mechanism under:

```text
backend/modules/sources/
```

The important concept is:

```text
Source configuration
        │
        ▼
Implementation name
        │
        ▼
Source registry / resolver
        │
        ▼
Concrete JobSource implementation
```

This is why a new source should not require manually changing the collector, matching, scheduler, apply, and status modules.

### About `job.register.js`

If a source package contains a `job.register.js`, its role should be source registration/bootstrap: making the new source implementation discoverable.

The important architectural rule is that registration should ultimately feed the common source-resolution mechanism. It should not become a place where platform-specific logic is duplicated across the whole application.

The current backend README/source structure establishes `JobSource.js` and the source implementation directory as the source abstraction boundary. Use the current source registry/registration code in the repository as the authoritative implementation when adding a source.

---

## Step 6 — Configure the source

Create/configure the corresponding source record with its relevant settings, such as:

- Source identity/name
- Active/inactive state
- Implementation
- External URL/configuration
- Application limits

---

## Step 7 — Test it

Use the existing source tests and `job_source_1` as examples.

The desired result is:

```text
New Source
    │
    ├── Collector works
    ├── Matching works
    ├── Scheduler works
    ├── Apply works
    └── Status works
```

without adding source-specific logic to those generic modules.

---

# 22. Important Design Boundaries

When extending JobPilot, preserve these boundaries.

### Collector vs Matching

```text
Collector = "What jobs exist?"
Matching  = "Is this job suitable?"
```

### Matching vs Scheduling

```text
Matching  = "Should this job proceed?"
Scheduler = "When can it be applied?"
```

### Scheduler vs Apply

```text
Scheduler = "When?"
Apply     = "Perform it now."
```

### Apply vs Status

```text
Apply  = "What happened during submission?"
Status = "What is the current state after submission?"
```

### Node vs Python

```text
Node.js = orchestration + business workflow
Python  = AI + document processing
```

### MongoDB vs Redis

```text
MongoDB = durable business state
Redis   = queues + shared scheduling coordination
```

---

# 23. Failure Scenarios

### User becomes inactive

The scheduler checks user state and does not schedule new applications for an inactive user.

Previously collected jobs can later be considered by old-job recovery.

### Source becomes inactive

The scheduler checks source state and does not schedule new applications against an inactive source.

### Matching worker fails

Matching work remains isolated in asynchronous processing and can be retried/reprocessed according to queue configuration.

### Apply worker fails

Application execution is isolated from collection and matching.

### Notification fails

Notification delivery is separated from core application state.

### Backend restarts

MongoDB retains durable business state and Redis retains queue/scheduling coordination.

### User pauses automation

New scheduling is blocked by user state, while historical recovery can later identify jobs collected during the paused period.

---

# 24. Scaling Considerations

The architecture is designed for independent scaling.

If matching becomes a bottleneck:

```text
Scale matching workers
```

rather than necessarily scaling the API server.

Likewise:

```text
Application bottleneck → Scale apply workers
Status bottleneck       → Scale status workers
Collection bottleneck   → Scale collector workers
```

The shared MongoDB/Redis infrastructure allows multiple worker processes to coordinate.

For larger deployments, the individual processes can be managed as separate services:

```text
API
Collector Workers
Matching Workers
Clarification Workers
Scheduler Workers
Apply Workers
Status Workers
Notification Workers
Recovery Worker
Python AI Service
```

---

# 25. Common Debugging Order

When something is not moving through the pipeline, check the stages in order.

### Jobs are not appearing

Check:

```text
Job source
   ↓
Collector
   ↓
MongoDB
```

### Jobs exist but are not matched

Check:

```text
Matching queue
Matching worker
Python AI service
```

### Jobs match but are not scheduled

Check:

```text
Scheduler worker
User status
User limits
Source status
Redis scheduling state
```

### Applications are scheduled but not submitted

Check:

```text
Apply queue
Apply worker
JobSource implementation
```

### Applications exist but status does not update

Check:

```text
Status producer
Status queue
Status worker
Source status implementation
```

### Events are processed but the user is not notified

Check:

```text
Notification queue
Notification worker
Notification configuration
```

---

# 26. Architecture Summary

JobPilot is best understood as a collection of cooperating pipelines rather than one large backend.

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
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
                 Reject            Match        Clarification
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

The four core principles are:

1. **Separate business responsibilities into modules.**
2. **Move long-running work into queues and workers.**
3. **Hide external job platforms behind a common source abstraction.**
4. **Keep AI/document processing separate from the main Node.js orchestration layer.**

Together, these choices make JobPilot easier to understand, test, extend, recover, and scale.
