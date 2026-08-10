# Internal Messaging Service — Task Tracker

## Project Status

**Current Phase:** Phase 1 — Project Foundation
**Frontend Stack:** React + Vite
**Backend Stack:** Node.js + Express
**Database:** PostgreSQL
**Status:** In Progress

---

# Phase 1 — Project Foundation

## 1. Project Initialization

* [done ] Initialize React + Vite frontend
* [ ] Install frontend dependencies
* [ ] Verify Vite development server
* [ ] Create `main.jsx`
* [ ] Create `App.jsx`
* [ ] Configure React Router

## 2. Frontend Structure

* [ ] Create `src/pages/`
* [ ] Create `src/pages/index.jsx`
* [ ] Create `src/pages/auth/`
* [ ] Create `src/pages/auth/index.jsx`
* [ ] Create `src/pages/auth/signup.jsx`
* [ ] Create `src/pages/auth/login.jsx`

### Frontend Supporting Structure

* [ ] Create `src/api/`
* [ ] Create `src/api/index.js`
* [ ] Create `src/api/client.js`
* [ ] Create `src/api/auth.js`
* [ ] Create `src/api/users.js`
* [ ] Create `src/api/conversations.js`
* [ ] Create `src/api/messages.js`
* [ ] Create `src/api/admin.js`
* [ ] Create `src/components/`
* [ ] Create `src/hooks/`
* [ ] Create `src/lib/`
* [ ] Create `src/utils/`
* [ ] Create `src/constants/`
* [ ] Create `src/types/`

## 3. Authentication — Signup

### Signup Fields

* [ ] Username
* [ ] Email
* [ ] Password
* [ ] Confirm Password

### Signup Validation

* [ ] Username is required
* [ ] Email is required
* [ ] Password is required
* [ ] Confirm Password is required
* [ ] Password and Confirm Password must match
* [ ] Username must not already exist in the database
* [ ] Email must not already exist in the database

### Signup Behavior

* [ ] Submit signup request through centralized API layer
* [ ] Handle signup success
* [ ] Automatically log the user in after successful signup
* [ ] Display success message as a popup
* [ ] Handle API errors

## 4. Authentication — Login

* [ ] Create login UI
* [ ] Username/email input
* [ ] Password input
* [ ] Basic required-field validation
* [ ] Connect login API
* [ ] Handle authentication success
* [ ] Handle authentication failure
* [ ] Store authentication state/token according to approved auth design
* [ ] Redirect authenticated user appropriately

## 5. API Layer

### Common Client

* [ ] Create centralized HTTP client
* [ ] Configure API base URL
* [ ] Configure common headers
* [ ] Configure response handling
* [ ] Configure common error handling
* [ ] Add authentication token handling after auth storage design is approved

### Authentication API

* [ ] Signup
* [ ] Login
* [ ] Logout
* [ ] Current user

### User API

* [ ] Get users
* [ ] Get user
* [ ] Search users

### Conversation API

* [ ] Create conversation
* [ ] Get conversations
* [ ] Get conversation
* [ ] Update status
* [ ] Update decision
* [ ] Update action
* [ ] Update follow-up

### Message API

* [ ] Send message
* [ ] Get messages
* [ ] Update message
* [ ] Mark message as read
* [ ] Delete message

### Admin API

* [ ] Get users
* [ ] Get conversations
* [ ] Get messages
* [ ] Update user status

## 6. Backend

* [ ] Verify existing backend structure
* [ ] Verify backend dependencies
* [ ] Verify Express server
* [ ] Verify PostgreSQL configuration
* [ ] Implement authentication APIs
* [ ] Implement user APIs
* [ ] Implement conversation APIs
* [ ] Implement message APIs
* [ ] Implement admin APIs

## 7. Database

* [ ] Verify PostgreSQL connection
* [ ] Create users table
* [ ] Create conversations table
* [ ] Create messages table
* [ ] Add required constraints
* [ ] Add indexes
* [ ] Add migrations
* [ ] Add seed data if required

## 8. Testing

* [ ] Start frontend successfully
* [ ] Start backend successfully
* [ ] Verify frontend → backend communication
* [ ] Test signup
* [ ] Test duplicate username
* [ ] Test duplicate email
* [ ] Test automatic login after signup
* [ ] Test login
* [ ] Test logout
* [ ] Test protected API requests

---

# Project Rules

1. Do not change the technology stack without explicit approval.
2. Do not change the approved project architecture without explicit approval.
3. Before implementing a significant structural change, explain the change and obtain approval.
4. After every approved change:

   * Show what changed.
   * Update `task.md`.
   * Update `track.md`.
5. Do not silently delete existing project files.
6. Do not silently replace existing implementations.
7. Do not assume missing requirements; ask when the decision materially affects architecture or behavior.
8. Build incrementally and verify each phase before moving forward.

---

# Current Decision

The frontend stack has been changed from **Next.js to React + Vite**.

The rest of the project direction remains unchanged unless explicitly approved otherwise.
