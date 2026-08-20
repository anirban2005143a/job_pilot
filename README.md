# JobPilot

JobPilot is a modular, asynchronous job-automation platform that covers the complete job-search and application lifecycle:

**Job Sources → Collection → Matching → Clarification → Scheduling → Application → Status Tracking → Notifications**

The project is intentionally split into independent services, domain modules, queues, and workers so that long-running operations do not block the main API server and individual parts can be developed, restarted, tested, and scaled independently.

The repository currently contains:

- A **Next.js frontend**
- A **Node.js/Express backend**
- A **Python/FastAPI AI service**
- A standalone **mock job-source server** for development and testing
- Independent BullMQ workers for collection, matching, clarification, scheduling, application, status checking, notifications, and recovery

---

## 1. Architecture at a Glance

```text
                         ┌─────────────────────┐
                         │     Next.js UI      │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │ HTTP
                                    ▼
                         ┌─────────────────────┐
                         │   Node / Express    │
                         │      API Server     │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
             MongoDB              Redis          Python AI Service
          Durable state       Queues / state      FastAPI / LLM
                 ▲                  │
                 │                  │
                 │       ┌──────────┴──────────┐
                 │       │                     │
                 │       ▼                     ▼
                 │   Matching Queue       Scheduler Queue
                 │       │                     │
                 │       ▼                     ▼
                 │   Matching Worker      Scheduler Worker
                 │       │                     │
                 │       ├── Reject             ▼
                 │       ├── Match          Apply Queue
                 │       └── Clarification      │
                 │              │               ▼
                 │              ▼          Apply Worker
                 │       Clarification           │
                 │          Queue                 ▼
                 │              │             Application
                 │              ▼                 │
                 │       Clarification           ▼
                 │          Worker          Status Queue
                 │                              │
                 │                              ▼
                 │                         Status Worker
                 │                              │
                 │                              ▼
                 │                      Notification Queue
                 │
                 └──── Collector ◄──── Job Sources
```

The key architectural principle is that each stage owns one responsibility:

- **Collector** collects and normalizes jobs.
- **Matching** decides whether a job is suitable.
- **Clarification** handles uncertain cases.
- **Scheduler** decides *when* an eligible application may run.
- **Apply** decides *how* to perform the application.
- **Status** monitors applications after submission.
- **Notification** communicates important events.
- **Recovery** brings missed jobs back into the normal pipeline.

---

## 2. Main Components

### Frontend

The frontend is a **Next.js 16 + React 19** application.

Location:

```text
frontend/
└── src/
    ├── app/
    │   ├── applied-jobs/
    │   ├── clarifications/
    │   ├── login/
    │   ├── signup/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── ui/
    │   ├── HomeView.tsx
    │   ├── JobSplitView.tsx
    │   ├── LoginForm.tsx
    │   ├── SignupLayout.tsx
    │   └── providers.tsx
    └── lib/
        ├── api.ts
        ├── dashboard-types.ts
        ├── store.ts
        └── types.ts
```

The frontend provides the user-facing layer for authentication, dashboard/job views, applied jobs, clarifications, and interaction with the backend API.

Important frontend technologies include:

- Next.js
- React
- Redux Toolkit / React Redux
- Tailwind CSS
- Radix UI
- React Markdown
- jsPDF
- Lucide icons
- React Toastify

The frontend talks to the Node backend through the configured API URL.

---

### Node.js Backend

Location:

```text
backend/
```

The backend is built with:

- Node.js
- Express 5
- MongoDB + Mongoose
- Redis
- BullMQ
- Axios
- JWT
- bcrypt
- Zod
- Multer
- Helmet
- CORS
- express-rate-limit
- p-limit

The backend is the main orchestration layer. It exposes the HTTP API and coordinates persistent data, queues, workers, job sources, scheduling, applications, and the Python AI service.

---

### Python AI Service

Location:

```text
python_server/
```

The Python service is a **FastAPI** application.

It is responsible for AI/document-heavy operations rather than general business orchestration.

Current responsibilities include:

- PDF resume parsing
- Resume summarization
- Job matching
- Job clarification generation
- Resume generation
- Cover-letter generation

Important endpoints include:

```text
GET  /
POST /parse
POST /summarize-resume
POST /match-job
POST /clarify-job
POST /create-resume
POST /create-cover-letter
```

The root endpoint can be used as a simple health check.

This separation keeps model/document-processing concerns out of the Node.js queue and API orchestration code.

---

### Mock Job Source

Location:

```text
job_source_1/
```

This is a standalone Express server that behaves like an external job platform.

It is useful for development because the rest of JobPilot can be tested without depending on a real job platform.

It maintains:

```text
jobs.json
applications.json
logs.txt
```

It can therefore simulate:

- Job collection
- Application submission
- Application state
- Request logging

It also contains source-level tests.

---

## 3. Repository Structure

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
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── job_source_1/
│   ├── jobs.json
│   ├── applications.json
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

---

# 4. End-to-End Job Lifecycle

A job should be understood as moving through a series of independent pipelines.

## 4.1 Collection

The collector discovers enabled job sources and asks each source for jobs.

```text
External Job Platform
        │
        ▼
    JobSource
        │
        ▼
Normalized Job
        │
        ▼
    MongoDB
        │
        ▼
 Matching Queue
```

The important point is that platform-specific formats are converted into a common internal job representation.

The collector does **not** decide whether the job is good for a user and does not perform applications.

---

## 4.2 Matching

The matching worker consumes jobs from the matching queue.

It combines information such as:

- User profile
- Resume
- User preferences
- Job requirements
- AI matching result

The result is conceptually one of:

```text
REJECT
MATCH
NEEDS_CLARIFICATION
```

A match does **not** mean "apply immediately".

It only means that the job is eligible to continue.

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
   ├── Reject
   │
   ├── Match ───────────────► Scheduler
   │
   └── Needs Clarification ─► Clarification Queue
```

---

## 4.3 Clarification

Some jobs cannot be safely accepted or rejected using the available information.

Instead of making an uncertain automatic decision, JobPilot sends them through a separate clarification pipeline.

```text
Needs Clarification
        │
        ▼
Clarification Queue
        │
        ▼
Clarification Worker
        │
        ▼
Clarification Data
        │
        ▼
Frontend / User Interaction
```

This creates a clean extension point for human-in-the-loop behaviour.

---

## 4.4 Scheduling

A suitable job is not necessarily applied immediately.

The scheduler evaluates operational constraints such as:

### User constraints

- Active/inactive state
- Daily application limit
- Current daily application count
- Daily reset
- Minimum interval between applications
- Already scheduled applications

### Source constraints

- Active/inactive state
- Maximum applications per hour
- Already reserved future application slots

The scheduler calculates the earliest valid time.

Conceptually:

```text
finalTime =
    max(
        currentTime,
        userNextAvailableTime,
        sourceNextAvailableTime
    )
```

Future source reservations are maintained in Redis. This is important because scheduled-but-not-yet-executed applications must still count against source capacity.

The scheduler answers:

> **When should this application happen?**

It does not perform the application.

---

## 4.5 Application

Once the scheduler has selected a valid time, the application is placed in the apply queue.

```text
Scheduler
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
    ├── Load User
    ├── Load Job
    ├── Load Source
    ├── Prepare Application Data
    ├── Generate / Load Resume
    ├── Generate / Load Cover Letter
    ├── Submit to Source
    └── Persist Application Result
```

The source-specific application behaviour is delegated to the selected `JobSource` implementation.

This means the generic application pipeline does not need to know how every job platform works.

The apply module answers:

> **How should the application be performed now?**

---

## 4.6 Status Checking

Application submission and application monitoring are separate.

The status pipeline periodically checks existing application records.

```text
Application
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
Updated Application Status
```

This prevents status checking from blocking new applications.

---

## 4.7 Notifications

Notifications have their own queue and worker.

This means a temporary notification problem does not need to make the underlying business operation fail.

The notification system can evolve independently of:

- Matching
- Scheduling
- Applying
- Status checking

---

## 4.8 Old Job Recovery

A job may be collected while a user is inactive or paused.

Without recovery, that job could remain in MongoDB without ever entering the user's normal matching/application flow.

The recovery worker periodically looks back over a configurable historical window and re-enters eligible jobs into normal processing.

```text
Previously Collected Jobs
          │
          ▼
Historical Window
          │
          ▼
Find Missed User/Job Combinations
          │
          ▼
Matching
          │
          ▼
Scheduling
          │
          ▼
Apply
```

This makes temporary inactivity recoverable rather than permanently losing opportunities.

---

# 5. Backend Modules

## API Layer

Location:

```text
backend/app.js
backend/server.js
backend/routes/
```

Responsibilities:

- HTTP requests
- Authentication
- Validation
- Route dispatch
- Invoking domain modules
- Returning responses

Current route groups include:

```text
/auth
/source
/user
```

Routes should stay relatively thin. Business logic belongs in the corresponding domain modules.

Long-running work should normally be delegated to queues/workers instead of being performed synchronously inside an HTTP request.

---

## Authentication

Location:

```text
backend/modules/auth/
```

Handles:

- User authentication
- Credential validation
- Password handling
- JWT-based authentication
- Authentication input validation

---

## User

Location:

```text
backend/modules/user/
```

The user is central to the automation pipeline.

User information influences:

- Resume/profile
- Preferences
- Active/inactive state
- Application limits
- Application counters
- Matching
- Scheduling

An inactive user should not receive new scheduled applications.

---

## Job

Location:

```text
backend/modules/job/
```

The job module represents normalized job data and related records.

Conceptually:

```text
Job
 ├── Source
 ├── Job Match
 └── Job Clarification
```

The repository layer provides a clean boundary between business logic and MongoDB access.

---

## Collector

Location:

```text
backend/modules/collector/
```

Main responsibilities:

1. Find enabled sources
2. Communicate with sources
3. Retrieve jobs
4. Normalize jobs
5. Persist jobs
6. Trigger downstream processing

The collector intentionally does not contain matching or application policy.

---

## Resume

Location:

```text
backend/modules/resume/
```

The Node layer manages resume representation and orchestration.

PDF/document-heavy processing is delegated to Python.

```text
Node.js
   │
   ▼
Python AI Service
   │
   ├── PDF parsing
   ├── Content extraction
   └── AI processing
```

---

## LLM

Location:

```text
backend/modules/llm/
```

This acts as the Node-side integration boundary for AI operations.

Keeping AI access behind a dedicated module prevents model/provider logic from spreading across unrelated modules.

---

## Matching

Location:

```text
backend/modules/matching/
```

Important pieces include:

```text
MatchingPipeline.js
matching.queue.js
matching.worker.js
start.js
```

The queue/worker architecture allows many jobs to be processed asynchronously without blocking the API or collector.

---

## Needs Clarification

Location:

```text
backend/modules/needsClarification/
```

Important pieces include:

```text
ClarificationPipeline.js
clarification.queue.js
clarification.worker.js
start.js
```

This is the asynchronous path for uncertain matching decisions.

---

## Scheduler

Location:

```text
backend/modules/scheduler/
```

Important pieces include:

```text
schedulerPipeline.js
scheduler.queue.js
scheduler.worker.js
start.js
```

The scheduler is the policy engine for application timing.

It does not submit applications.

---

## Apply

Location:

```text
backend/modules/apply/
```

Important pieces include:

```text
application.model.js
apply.queue.js
apply.worker.js
applyPipeline.js
start.js
```

The apply pipeline executes the application after the scheduler has selected a valid time.

---

## Check Status

Location:

```text
backend/modules/check_status/
```

Important pieces include:

```text
check_status.producer.js
check_status.queue.js
check_status.worker.js
start.js
```

This pipeline monitors submitted applications independently.

---

## Notification

Location:

```text
backend/modules/notification/
```

Important pieces include:

```text
notification.queue.js
notification.service.js
notification.template.js
notification.worker.js
start.js
```

Notification delivery is intentionally isolated from the core business pipeline.

---

## Old Job Recovery

Location:

```text
backend/modules/oldJobRecovery/
```

The recovery worker looks for jobs that were missed while a user was inactive and puts eligible work back into the normal processing path.

The recovery period is configuration-driven.

---

# 6. Queue-Based Architecture

JobPilot uses **BullMQ + Redis** for asynchronous processing.

Each major pipeline has its own queue/worker boundary.

```text
Collector
   │
   ▼
Matching Queue
   │
   ▼
Matching Worker
   │
   ├──────────────► Clarification Queue
   │                       │
   │                       ▼
   │                Clarification Worker
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
Application
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

Benefits:

- Non-blocking HTTP requests
- Independent failure domains
- Retryable asynchronous work
- Controlled concurrency
- Independent worker scaling
- Better recovery after restarts

---

# 7. Data Model

MongoDB is the durable source of truth for important business state.

The major conceptual entities are:

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

Contains identity and automation configuration.

### Source

Represents an external job platform and its source-level configuration.

### Job

A normalized job independent of the original platform's response format.

### Job Match

Represents the relationship between a user and a job after matching.

### Job Clarification

Stores information for jobs that require clarification.

### Application

Represents an application attempt.

Applications are separate from jobs because the same job can be relevant to multiple users.

---

# 8. Job Source Abstraction

One of the most important design decisions is the `JobSource` abstraction.

Location:

```text
backend/modules/sources/
```

Important files:

```text
JobSource.js
source.model.js
source.controller.js
source.validate.js
source.registry.js
sources/
```

The rest of the backend interacts with the abstract source rather than directly depending on a specific job platform.

```text
                    JobPilot
                       │
                 JobSource API
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
         Source A             Source B
             │                   │
       Platform API        Platform API
```

A source implementation is responsible for understanding its own:

- External API
- Job format
- Job normalization
- Application mechanism
- Status mechanism, when supported

The rest of the system works with normalized data.

This is why adding a new source should not require rewriting:

- Matching
- Scheduling
- Job storage
- Application orchestration
- Status processing

---

# 9. Adding a New Job Source

The source system is designed so that a new platform can be added without creating platform-specific code throughout the application.

## Step 1 — Create the source implementation

Add the implementation under:

```text
backend/modules/sources/sources/
```

The implementation should follow the contract defined by:

```text
backend/modules/sources/JobSource.js
```

The exact methods depend on the current source contract, so use the existing source implementation as the template.

---

## Step 2 — Normalize the job

The new source converts its external job response into JobPilot's normalized job representation.

The rest of the system should never need to know that, for example, one platform calls a field `job_title` while another calls it `positionName`.

---

## Step 3 — Implement application behaviour

The source implementation must expose the behaviour required by the generic apply pipeline.

The apply module should not contain:

```text
if source == LinkedIn ...
if source == Indeed ...
if source == ...
```

Instead, the selected `JobSource` handles the platform-specific operation.

---

## Step 4 — Implement status behaviour

If the source supports application-status checking, implement the required status operation for that source.

The status worker can then use the same source abstraction.

---

## Step 5 — Register the implementation

The current main branch uses:

```text
backend/modules/sources/source.registry.js
```

The registry maps an implementation name to its class.

Conceptually:

```text
implementation name
        │
        ▼
source.registry.js
        │
        ▼
Source class
        │
        ▼
JobSource instance
```

For example, the current registry maps the configured `JobSource1` implementation to the corresponding source class.

When a MongoDB source record contains its implementation name, the registry can create the correct source object automatically.

This is the important idea:

> **The database stores which implementation a source uses; the registry resolves that name to the correct class.**

So the collector, scheduler, apply pipeline, and status pipeline do not need to manually instantiate a different class for every source.

### About `job.register.js`

If a job-source package introduces a `job.register.js` file, it should be treated as a **source registration/bootstrap layer**: its job is to make the source implementation discoverable to the application rather than duplicating source-specific wiring throughout the system.

The current `main` branch exposes the central backend registry as `source.registry.js`; that registry is the authoritative source-resolution mechanism in this repository. If `job.register.js` is added/used by a newer source implementation, it should feed into the same registration concept rather than becoming another place where the entire application pipeline is customized.

---

## Step 6 — Create/configure the source record

Create the corresponding source configuration/record with the implementation name and source settings.

Typical source-level information includes:

- Name
- Base URL
- Active/inactive state
- Implementation name
- Maximum applications per hour
- Polling interval

Once the source is registered and configured, the normal pipeline can consume it.

---

## Step 7 — Test the source

Use the existing source tests as the model.

At minimum verify:

```text
Source creation
Job fetching
Job normalization
Application submission
Status behaviour (if supported)
```

The goal is:

```text
New Source
    │
    ├── Collector works
    ├── Matching works
    ├── Scheduler works
    ├── Apply works
    └── Status works
```

without modifying those modules for every new platform.

---

# 10. Environment Configuration

Backend configuration is centralized through:

```text
backend/config/env.js
```

Configuration includes values for:

- MongoDB
- Redis
- JWT/authentication
- Python/AI service URL
- Queue behaviour
- Application limits/intervals
- Recovery window
- Other runtime settings

Do not commit secrets.

The exact environment variable names in `backend/config/env.js` should be treated as authoritative because they may evolve with the implementation.

One important scheduling setting is the default application interval:

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

The current example uses:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Change it if the backend runs elsewhere.

---

# 11. Running the System Locally

## Prerequisites

Install/configure:

- Node.js
- npm
- Python 3.x
- MongoDB
- Redis
- A configured LLM/AI provider
- Access to a real job source, or use `job_source_1` for local testing

---

## 11.1 Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The Next.js development server normally runs at:

```text
http://localhost:3000
```

---

## 11.2 Start the Node Backend

```bash
cd backend
npm install
npx nodemon server.js
```

The frontend example configuration expects:

```text
http://localhost:5000
```

for the backend API.

The backend must be able to reach:

- MongoDB
- Redis
- Python AI service
- Configured job sources

---

## 11.3 Start the Python AI Server

Create/activate the Python environment and install the project's Python dependencies.

Then:

```bash
cd python_server
uvicorn server:app --reload
```

If the project is configured to use a specific port/host, use those values in the backend configuration.

---

## 11.4 Start the Mock Job Source

```bash
cd job_source_1
npm install
npm run dev
```

The mock source uses `nodemon` through its package script.

It stores test state in:

```text
jobs.json
applications.json
logs.txt
```

---

# 12. Start All Backend Workers

Workers are intentionally separate Node processes.

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

### Check Status

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

The recovery module currently exposes its worker directly:

```bash
cd backend
npx nodemon modules/oldJobRecovery/oldJobRecovery.worker.js
```

> If a module's entry point changes later, use the `start.js`/worker entry point currently present in that module as the authoritative command.

---

# 13. Recommended Development Startup

For a complete local environment, run these processes:

```text
1. Frontend
2. Node API server
3. Python AI server
4. Job source server
5. Collector
6. Matching worker
7. Clarification worker
8. Scheduler worker
9. Apply worker
10. Status worker
11. Notification worker
12. Old-job recovery worker
13. MongoDB
14. Redis
```

A practical terminal layout is:

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

For production, these processes do not need to remain separate terminal sessions. They can be managed using containers, a process manager, or an orchestration platform.

---

# 14. Testing

The repository contains tests around important domain boundaries.

Examples:

```text
backend/modules/apply/test_apply_pipeline.js
backend/modules/scheduler/test_scheduler_pipeline.js
backend/modules/needsClarification/test_clarification_pipeline.js
backend/modules/sources/test_job_source_class.js
job_source_1/server.test.js
```

Useful test categories are:

### Unit tests

Test individual business rules.

### Pipeline tests

Test the sequence of operations within a module.

### Source tests

Verify that a source follows the `JobSource` contract.

### Integration tests

Verify interactions between:

```text
MongoDB
Redis
Queues
Workers
Python service
Job source
```

Because the architecture isolates business pipelines, many tests can run without starting the entire platform.

---

# 15. Reliability and Recovery

JobPilot is designed around the assumption that individual processes can fail or restart.

### Queue isolation

Each major asynchronous stage has its own queue/worker boundary.

A matching failure does not require the API server to stop.

### Durable state

Important business state is stored in MongoDB rather than only in process memory.

Workers can reconstruct state after a restart.

### Redis coordination

Redis provides queue infrastructure and shared scheduling state.

This is especially important when multiple scheduler workers are running.

### Application state

Applications are stored separately from jobs so their status can change after submission.

### Old-job recovery

Jobs missed because a user was inactive can be reconsidered later.

---

# 16. Important Design Boundaries

These boundaries are useful when modifying the system.

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

### Scheduling vs Apply

```text
Scheduler = "When?"
Apply     = "How?"
```

### Apply vs Status

```text
Apply  = "What happened during submission?"
Status = "What is the current state after submission?"
```

### Node vs Python

```text
Node.js  = orchestration + business workflow
Python   = AI/document processing
```

### MongoDB vs Redis

```text
MongoDB = durable business state
Redis   = queues + fast coordination/scheduling state
```

Keeping these boundaries intact makes the project easier to extend.

---

# 17. Adding More AI Providers

AI-specific work is separated behind the Python service and Node-side LLM boundary.

This allows the model/provider implementation to change without forcing the matching, scheduling, application, or frontend modules to understand provider-specific details.

Possible future providers/models can therefore be introduced behind the existing AI interfaces.

---

# 18. Scaling

The architecture is designed for independent scaling.

For example, if matching becomes the bottleneck:

```text
Do not necessarily scale API servers.

Scale:
Matching Workers
```

Similarly:

```text
Application bottleneck
        ↓
Scale Apply Workers
```

The same idea applies to:

- Collector workers
- Scheduler workers
- Status workers
- Notification workers

MongoDB remains the durable shared state layer and Redis provides shared queue/scheduling coordination.

---

# 19. Common Failure Scenarios

### User becomes inactive

The scheduler prevents new applications from being scheduled.

Previously collected jobs can later be considered by recovery.

### Source becomes inactive

The scheduler should not schedule new applications for that source.

### Matching worker fails

The matching workload remains isolated in its queue and can be retried/reprocessed according to queue configuration.

### Apply worker fails

Application execution is isolated from collection and matching, allowing controlled retries.

### Notification fails

Notification delivery should not become the source of truth for application state.

### Backend restarts

MongoDB preserves business state and Redis preserves queue/scheduling coordination.

### User pauses automation

New scheduling stops, while historical recovery can later find jobs collected during the paused period.

---

# 20. Frontend/Backend Communication

The frontend is a normal web client and communicates with the Node backend through HTTP APIs.

The important distinction is:

```text
Frontend
   │
   │ HTTP
   ▼
Node API
   │
   ├── Immediate request/response work
   │
   └── Long-running work
          │
          ▼
       BullMQ
          │
          ▼
        Workers
```

The frontend therefore does not need to communicate directly with every worker.

For example, starting an automation-related operation can result in:

```text
Frontend
   │
   ▼
Node API
   │
   ▼
Queue
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

This is the main reason the worker architecture does not make frontend/backend communication impossible: the frontend talks to the API, while the API and workers communicate through shared durable state and queues.

---

# 21. Development Philosophy

The project follows a few important principles:

1. **Keep routes thin.**
2. **Keep platform-specific code inside JobSource implementations.**
3. **Do not put matching logic inside the collector.**
4. **Do not put scheduling policy inside the apply module.**
5. **Do not put platform-specific submission logic inside the generic apply pipeline.**
6. **Keep AI/document processing behind the Python service.**
7. **Use queues for long-running asynchronous work.**
8. **Keep durable business state in MongoDB.**
9. **Use Redis for queues and shared scheduling coordination.**
10. **Make recovery a first-class part of the system.**

---

# 22. Quick Reference

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | Next.js / React | User interface |
| API | Node.js / Express | HTTP API and orchestration |
| Database | MongoDB / Mongoose | Durable application state |
| Queue | BullMQ / Redis | Async processing |
| AI Service | FastAPI / Python | AI and document processing |
| Job Sources | Source adapters | Platform-specific job/application logic |
| Collector | Node worker | Job ingestion |
| Matching | Node worker | Job suitability |
| Clarification | Node worker | Uncertain cases |
| Scheduler | Node worker | Application timing/limits |
| Apply | Node worker | Application execution |
| Status | Node worker | Application monitoring |
| Notification | Node worker | Event delivery |
| Recovery | Node worker | Reprocess missed jobs |

---

# 23. Minimal Startup Checklist

Before debugging application logic, make sure the following are running:

```text
[ ] MongoDB
[ ] Redis
[ ] Python AI service
[ ] Node API
[ ] Job source
[ ] Collector
[ ] Matching worker
[ ] Clarification worker
[ ] Scheduler worker
[ ] Apply worker
[ ] Status worker
[ ] Notification worker
[ ] Recovery worker
[ ] Frontend
```

If the UI loads but jobs are not moving through the system, check the workers and Redis first.

If jobs are collected but not matched, check the matching worker and Python AI service.

If jobs match but applications do not appear, check the scheduler and apply workers.

If applications exist but their status does not change, check the status worker and source status implementation.

---

## Summary

JobPilot is best understood not as a single backend server, but as a set of cooperating pipelines.

The core flow is:

```text
Job Source
    ↓
Collector
    ↓
Normalized Job
    ↓
Matching
    ├── Reject
    ├── Clarification
    └── Match
            ↓
        Scheduler
            ↓
        Apply Queue
            ↓
        Apply Worker
            ↓
        Application
            ↓
        Status Checking
            ↓
        Notifications
```

MongoDB provides durable state, Redis/BullMQ provides asynchronous coordination, Python handles AI/document operations, Node.js owns business orchestration, and the Next.js frontend provides the user-facing control layer.

The most important extensibility point is the **JobSource abstraction**: adding a new job platform should primarily require implementing and registering that source, while the collector, matching, scheduler, apply, and status pipelines remain generic.
