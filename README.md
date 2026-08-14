# Driving School Platform - Backend

## Overview of the Problem We Solve
The Driving School Platform is designed to modernize and streamline the operations of driving schools. It provides a centralized system to manage student enrollments, mentor assignments, course curriculum, scheduling, attendance, and task grading. By integrating with national services like Fayda (Ethiopian National ID) for identity verification and Chapa for seamless payments, it ensures a secure, compliant, and efficient experience for students, mentors, and administrators.

## Project Architecture
The backend is built using a strict layered architecture:
- **Stack**: Express.js, TypeScript, PostgreSQL, Prisma ORM, Zod, JWT
- **Layering Principle**: `Routes → Middlewares → Controllers → Services → Models (Prisma)`
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
4. **Database Setup**:
   Ensure your local PostgreSQL service is running and your `.env` is configured with the correct `DATABASE_URL`.
   Then, apply Prisma migrations and generate the Prisma client:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
5. **Run the Application**:
   For development (with hot-reload):
   ```bash
   npm run dev
   ```

## The Team
- **Zeamanuel Mebit** (ID: CTC-3498-26) - Lead, Code Reviewer
- **Yonas** (ID: [id]) - Backend dev
- **Yeabsra** (ID: [id]) - Frontend dev
- **Yohannes** (ID: [id]) - UI/UX designer, frontend dev
