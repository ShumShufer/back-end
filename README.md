# Driving School Platform - Backend

## Overview of the Problem We Solve

The Driving School Platform is designed to modernize and streamline the operations of driving schools. It provides a centralized system to manage student enrollments, mentor assignments, course curriculum, scheduling, attendance, and task grading. By integrating with national services like Fayda (Ethiopian National ID) for identity verification and Chapa for seamless payments, it ensures a secure, compliant, and efficient experience for students, mentors, and administrators.

## Project Architecture

The backend is built using a strict layered architecture:

- **Stack**: Express.js, TypeScript, PostgreSQL, Prisma ORM, Zod, JWT
- **Layering Principle**: `Routes → Middlewares → Controllers → Services (Prisma)`
- **Core Features**: Role-Based Access Control (RBAC), JWT authentication, input validation via Zod, and centralized error handling.

## How to Set Up and Run

### Prerequisites

- Node.js (v18+)
- PostgreSQL (installed and running locally)

### Setup Instructions

1. **Clone the repository** and navigate to the backend directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Copy the example environment file and configure it.
   ```bash
   cp .env.example .env
   ```
4. **Database Setup & Seed**:
   Ensure your local PostgreSQL service is running and your `.env` is configured with the correct `DATABASE_URL`.
   Then, apply Prisma migrations, generate the Prisma client, and seed the demo data:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run prisma:seed
   ```
5. **Run Tests**:
   Run the automated test suite (15/15 passing tests):
   ```bash
   npm test
   ```
6. **Run the Application**:
   For development (with hot-reload):
   ```bash
   npm run dev
   ```
   For production:
   ```bash
   npm run build
   npm start
   ```

### Automated Background Workers
The backend includes a built-in scheduler (`src/jobs/scheduler.ts`) that runs:
- `ScheduleReminderJob`: Sends upcoming class reminders to students & mentors (every 1 hour).
- `ApplicationDeadlineJob`: Alerts school admins about stale pending applications (every 6 hours).
- `PriceRecalculationJob`: Periodically updates course pricing statistics across schools (every 12 hours).

## The Team

- **Zeamanuel Mebit** (ID: CTC-3498-26) - Lead, Code Reviewer
- **Yonas** (ID: CTC-3303-26 ) - Backend dev
- **Yeabsra** ( ID: CTC-2878-26 ) - Frontend dev
- **Yohannes** ( ID: CTC-7823-26 ) - UI/UX designer, frontend dev
