# Deployment Plan: Student Essential Shop

## 00-overview
- **Frontend Path:** `/Users/yuhe/COS108/Student Essential Shop/frontend/my-app`
- **Backend Path:** `/Users/yuhe/COS108/Student Essential Shop/backend`

## 01-frontend-hardening
- [x] Inspect the React frontend and confirm it uses Vite.
- [x] Make the frontend deployment-friendly for Vercel.
- [x] Scan for hard-coded localhost URLs, fixed ports, absolute local paths, and other local-only assumptions.
- [x] Replace hard-coded backend URLs with environment-variable-based configuration using Vite-compatible variables such as `import.meta.env` and `.env` files.
- [x] Ensure production-safe defaults and document required environment variables.
- [x] Review package metadata and scripts; fix build/dev/preview scripts if needed.
- [x] Add or update supporting files (`.env.example`, `.gitignore`, Vercel config if needed).
- [x] Run install, build, and relevant checks to verify the frontend is deployable.
- [x] Produce a short frontend deployment readiness report.

## 02-backend-hardening
- [x] Inspect the Flask backend structure.
- [x] Make the backend deployment-friendly for PythonAnywhere.
- [x] Scan for hard-coded localhost values, debug-only settings, local file paths, missing production config, and unsafe defaults.
- [x] Externalize configuration into environment variables where appropriate.
- [x] Create or update `requirements.txt`, `.env.example`, `.gitignore`.
- [x] Confirm the app entry point, WSGI setup needs, and dependency completeness.
- [x] Add or verify a lightweight health endpoint such as `/api/health`.
- [x] Test the backend locally in a production-like way where possible.

## 03-cross-stack-review
- [x] Check all frontend-backend integration points.
- [x] Ensure frontend uses the correct backend base URL through environment variables.
- [x] Ensure backend CORS configuration allows the actual frontend deployment origin and avoids insecure wildcard usage unless explicitly justified.
- [x] Verify any auth callbacks, API prefixes, static asset assumptions, and cookie/session settings if present.
- [x] Document the exact environment variables required on both platforms.

## 04-git-init
- [x] Initialize a git repository in the frontend folder if one does not already exist.
- [x] Initialize a git repository in the backend folder if one does not already exist.
- [x] Create sensible initial commits.
- [x] Confirm `.gitignore` coverage.
- [x] Show remotes status and repo health.

## 05-ssh-setup
- [x] Check whether the user already has a suitable SSH key for GitHub.
- [x] If not, generate one locally using a safe modern default.
- [x] Show the public key to the user when needed.
- [x] Test local SSH agent/key setup if required.

## 06-github-setup
- [ ] Navigate to GitHub signup/login via BrowserOS.
- [ ] Navigate to SSH keys settings page.
- [ ] Add SSH key.
- [ ] Test SSH connectivity.

## 07-github-push
- [x] Create a single GitHub repo for the monorepo (frontend + backend).
- [x] Add the remote locally and push code.

## 08-pythonanywhere-deploy
- [x] Navigate to PythonAnywhere via BrowserOS.
- [x] Setup Flask app, config WSGI, env vars.
- [x] Test deployed backend health endpoint.

## 09-vercel-deploy
- [ ] Navigate to Vercel via BrowserOS.
- [ ] Create new project from GitHub repo.
- [ ] Set environment variables.
- [ ] Deploy and test.

## 10-final-validation
- [ ] Test end to end.
- [ ] Verify frontend-backend comms.
- [ ] Final status report.
