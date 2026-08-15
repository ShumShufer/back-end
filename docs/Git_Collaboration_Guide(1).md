# Git Collaboration Guide

## Our Branch Structure

Each repository has its own development branch.

```text
main
  ↑
  ├── back-end-dev
  │     ↑
  │     ├── feature/login
  │     └── feature/student-api
  │
  └── front-end-dev
        ↑
        ├── feature/login-page
        └── feature/student-dashboard
```

- **`main`** is the stable branch. Do not work directly on it.
- **`back-end-dev`** is the shared development branch for the backend repository.
- **`front-end-dev`** is the shared development branch for the frontend repository.
- **Feature branches** are where you work on your individual tasks.

---

## 1. Start a New Task

Always start from the latest development branch.

### Backend

```bash
# Move to the shared backend development branch.
git checkout back-end-dev

# Download and apply the latest changes from GitHub.
git pull origin back-end-dev

# Create a new branch for your task and move to it.
git checkout -b feature/my-task
```

### Frontend

```bash
# Move to the shared frontend development branch.
git checkout front-end-dev

# Download and apply the latest changes from GitHub.
git pull origin front-end-dev

# Create a new branch for your task and move to it.
git checkout -b feature/my-task
```

Use a clear name for your task, for example:

```text
feature/student-profile
feature/login
feature/dorm-allocation
```

---

## 2. Save and Upload Your Work

After making and testing your changes:

```bash
# Add your changed files to the next commit.
git add .

# Create a saved checkpoint containing your changes.
git commit -m "Add student profile"

# Upload your branch and its commits to GitHub.
git push -u origin feature/student-profile
```

After the first push, you can normally use:

```bash
# Upload your newest commits to your existing GitHub branch.
git push
```

---

## 3. Create a Pull Request

On GitHub, create a Pull Request from your feature branch into the correct development branch.

For the backend:

```text
feature/my-task → back-end-dev
```

For the frontend:

```text
feature/my-task → front-end-dev
```

Do **not** create the Pull Request directly into `main`.

Your teammates will review your changes. If they request changes, make the changes on the same branch, commit them, and push again. The existing Pull Request will automatically update.

---

## 4. Keep Your Branch Up to Date

Other team members may merge their work while you are working.

Before your Pull Request is merged, bring the latest development branch into your feature branch.

### Backend

```bash
# Move to the shared backend development branch.
git checkout back-end-dev

# Get the latest backend changes from GitHub.
git pull origin back-end-dev

# Return to your feature branch.
git checkout feature/my-task

# Bring the latest backend development changes into your branch.
git merge back-end-dev

# Upload the updated branch to GitHub.
git push
```

### Frontend

Use the same process with `front-end-dev`:

```bash
# Move to the shared frontend development branch.
git checkout front-end-dev

# Get the latest frontend changes from GitHub.
git pull origin front-end-dev

# Return to your feature branch.
git checkout feature/my-task

# Bring the latest frontend development changes into your branch.
git merge front-end-dev

# Upload the updated branch to GitHub.
git push
```

If Git reports a conflict, resolve it on **your feature branch**, test the code, then commit and push the result.

---

## 5. After Your Pull Request Is Merged

Update your development branch:

```bash
# Move back to the shared development branch.
git checkout back-end-dev

# Download the latest version of the development branch.
git pull origin back-end-dev
```

Then remove your finished local feature branch:

```bash
# Delete the local feature branch because the task has been completed.
git branch -d feature/my-task
```

For the frontend, use `front-end-dev` instead.

Then start your next task from the latest development branch.

---

# Team Rules

### Always do these things

- Create a separate feature branch for each task.
- Start your branch from the latest development branch.
- Commit your work regularly.
- Push your feature branch to GitHub.
- Create Pull Requests into `back-end-dev` or `front-end-dev`.
- Keep your feature branch updated when the development branch changes.
- Test your work before asking for a review.

### Never do these things

- Do not push directly to `main`.
- Do not push directly to `back-end-dev` or `front-end-dev`.
- Do not work on another person's feature branch.
- Do not put several unrelated tasks into one feature branch.
- Do not use `git push --force` unless the team has agreed that it is necessary.

---

## The Workflow to Remember

```text
Get the latest development branch
            ↓
Create your feature branch
            ↓
Work and commit your changes
            ↓
Push your feature branch
            ↓
Create a Pull Request
            ↓
Team reviews your code
            ↓
Fix anything that needs changing
            ↓
Pull Request is merged
            ↓
Delete the finished feature branch
            ↓
Start your next task
```

**Simple rule:**

> Work on your own feature branch → create a Pull Request into the appropriate development branch → merge into `main` only when the team is ready to release.
