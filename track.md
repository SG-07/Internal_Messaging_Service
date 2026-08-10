# Internal Messaging Service — Change Tracker

This file records approved project decisions, structural changes, implementation changes, and important project events.

---

## 2026-08-10 — Frontend Stack Changed

### Decision

The frontend technology stack was changed from:

```text
Next.js
```

to:

```text
React + Vite
```

### Reason

The project will be rebuilt from the beginning using a standalone React frontend.

### Preserved

The following remain unchanged unless explicitly approved otherwise:

* Backend architecture
* Database architecture
* API-oriented application architecture
* Authentication requirements
* User requirements
* Conversation requirements
* Messaging requirements
* Admin requirements
* Existing project principles
* Phase-based development process

### New Frontend Direction

```text
React
  +
Vite
  +
React Router
```

The frontend will communicate with the Express backend through the centralized API layer.

---

## 2026-08-10 — Frontend Restart

The previous Next.js frontend initialization was abandoned as part of the approved stack change.

The partially created Next.js project should not be treated as the final frontend implementation.

The React frontend will be initialized cleanly.

---

## 2026-08-10 — Approved Frontend Structure

The planned React frontend structure is:

```text
frontend/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── pages/
│   │   ├── index.jsx
│   │   └── auth/
│   │       ├── index.jsx
│   │       ├── signup.jsx
│   │       └── login.jsx
│   │
│   ├── api/
│   │   ├── index.js
│   │   ├── client.js
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── conversations.js
│   │   ├── messages.js
│   │   └── admin.js
│   │
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── utils/
│   ├── constants/
│   └── types/
│
├── package.json
├── package-lock.json
└── Vite configuration
```

### Routing Decision

React Router will handle frontend routes.

Planned routes include:

```text
/
 /auth
 /auth/signup
 /auth/login
```

Additional application routes will be added as their respective features are implemented.

---

## 2026-08-10 — Signup Requirements Confirmed

### Fields

```text
Username
Email
Password
Confirm Password
```

### Validation

```text
Username is required
Email is required
Password is required
Confirm Password is required
Password must match Confirm Password
Username must not already exist
Email must not already exist
```

### Behavior

After successful signup:

```text
Signup
  ↓
Successful registration
  ↓
Automatic login
  ↓
Success popup
```

API testing will be performed later as the backend/API implementation progresses.

---

## 2026-08-10 — Centralized API Architecture

The frontend will use a centralized API layer rather than placing raw HTTP requests throughout individual pages.

Planned structure:

```text
src/api/
├── index.js
├── client.js
├── auth.js
├── users.js
├── conversations.js
├── messages.js
└── admin.js
```

### Responsibility

`client.js`

* Common HTTP requests
* Base API configuration
* Common headers
* Response handling
* Common error handling
* Future authentication-token handling

Resource modules:

```text
auth.js
users.js
conversations.js
messages.js
admin.js
```

Each module owns API operations for its respective domain.

---

## 2026-08-10 — Authentication Token Handling Deferred

JWT/token storage and automatic authorization-header handling have **not** been finalized.

No assumption will be made about:

* Token storage mechanism
* Cookie vs local storage
* Token refresh behavior
* Authorization middleware behavior

These decisions will be made before implementing protected frontend API behavior.

---

# Current Status

**Phase:** Phase 1 — Project Foundation

**Frontend:** React + Vite — restart pending

**Backend:** Existing project direction retained

**Database:** PostgreSQL

**Authentication:** Requirements defined; implementation pending

**API Layer:** Architecture defined; React implementation pending

**Next Approved Work:** Initialize the clean React + Vite frontend.
