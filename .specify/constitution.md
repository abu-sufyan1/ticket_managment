# Project Constitution — HelpDesk Support Ticket System

## Vision
Build a production-grade, full stack AI-powered support ticket system that real customers can use. The system automates repetitive support tasks using AI while keeping humans in control for complex or sensitive issues.

## Core Principles

### 1. Engineering First
- Every line of AI-generated code must be reviewed, understood, and validated
- Refactor constantly — do not ship messy code just because AI wrote it fast
- Establish patterns early and enforce them throughout the codebase

### 2. Separation of Concerns
- Frontend (React) and Backend (Express) are completely separate projects
- Clear API contracts between frontend and backend
- No framework magic that blurs the lines between layers

### 3. Test Everything
- All features must be backed by automated tests
- Write tests alongside features, not after
- Tests are not optional — they are part of the definition of done

### 4. AI as an Accelerator, Not a Replacement
- AI handles mechanical, repetitive, boilerplate work
- Engineers handle architecture, decisions, and code review
- AI features must be explainable and controllable

### 5. Security by Default
- Authentication and authorization on every protected route
- Role-based access control enforced at both API and UI layers
- No sensitive data exposed to unauthorized users

### 6. Production Readiness
- Error logging and monitoring from day one
- Dockerized for consistent environments
- CI/CD pipeline with automated deployment
- Graceful error handling throughout

## Non-Negotiables
- No feature ships without tests
- No direct database access from the frontend
- No hardcoded secrets — use environment variables
- Role checks must happen server-side, never trust the client
- All AI-generated responses must be reviewed before display to customers
