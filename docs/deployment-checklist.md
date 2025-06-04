# Application Deployment Checklist

This checklist provides a structured approach for deploying new versions of the Pediatric Health Assessment application. It aims to ensure smooth and reliable deployments.

## 1. Pre-Deployment Phase

### 1.1. Code & Feature Readiness

- [ ] **Code Complete**: All planned features and bug fixes for the release are implemented.
- [ ] **Code Review**: All code changes have been peer-reviewed and approved according to project guidelines.
- [ ] **Branching**: Code is merged into the appropriate release branch (e.g., `main` or a dedicated `release/vX.Y.Z` branch).
- [ ] **Documentation**: Relevant technical documentation (API docs, configuration changes, new feature guides) is updated. (See [EmailService API](mdc:docs/api/email-service.md), [Email Templates](mdc:docs/email-templates.md), [Configuration](mdc:docs/configuration.md)).

### 1.2. Testing & Quality Assurance

- [ ] **Unit Tests**: All unit tests are passing in the CI environment.
- [ ] **Integration Tests**: All integration tests are passing in the CI environment.
- [ ] **End-to-End (E2E) Tests**: All E2E tests are passing against a staging or pre-production environment that mirrors production.
- [ ] **Manual QA**: Manual testing of critical user flows and new features has been completed and signed off (if applicable).
- [ ] **Browser/Device Compatibility**: Tested on target browsers and devices as per requirements.

### 1.3. Dependencies & Environment

- [ ] **Dependency Audit**: Project dependencies (npm packages) are up-to-date and checked for known vulnerabilities (e.g., `npm audit`).
- [ ] **Environment Variables**: All required environment variables for the target environment (staging/production) are prepared, verified, and securely stored. Refer to the [Application Configuration document](mdc:docs/configuration.md).
  - [ ] Confirm `RESEND_API_KEY`, `FROM_EMAIL`.
  - [ ] Confirm Supabase URLs and keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` if used).
  - [ ] Confirm other critical variables (`NEXT_PUBLIC_BASE_URL`, etc.).
- [ ] **Database Migrations**: Any necessary database schema migrations are scripted, tested in a staging environment, and ready for execution. A rollback plan for migrations is in place.
- [ ] **Third-Party Services**:
  - [ ] **Resend**: Sending domain is verified. API key is active. Check account status and limits.
  - [ ] **Supabase**: Project is active. Check for any service notifications or quota issues.
  - [ ] Other external services: Confirm operational status and any necessary configuration.

### 1.4. Planning & Preparation

- [ ] **Rollback Plan**: A documented rollback plan is reviewed and ready in case of deployment failure. (See `docs/rollback-procedures.md` - to be created in subtask 10.16).
- [ ] **Deployment Window**: If applicable, a deployment window (e.g., low-traffic period) is scheduled.
- [ ] **Stakeholder Communication**: A plan for communicating deployment start, progress, and completion (or any issues) to relevant stakeholders is prepared.
- [ ] **Monitoring Setup**: Ensure monitoring and alerting tools (e.g., Sentry, Vercel Analytics, Supabase logs) are configured for the new release and key personnel have access.

## 2. Deployment Phase

- [ ] **Backup (If Applicable)**: Critical data or application state backed up before deployment (especially for database changes or stateful services).
- [ ] **Announce Deployment Start**: Notify stakeholders if planned.
- [ ] **Execute Migrations (If Any)**: Run database migrations against the target environment. Monitor for success or errors.
- [ ] **Deploy Application**:
  - For platforms like Vercel, this is typically triggered by a push/merge to the production branch.
  - Monitor the CI/CD pipeline for build and deployment steps.
- [ ] **Verify Build Success**: Confirm the build completed without errors in the CI/CD pipeline.
- [ ] **Verify Deployment Success**: Confirm the new version is live on the target environment (e.g., Vercel deployment status, server logs).

## 3. Post-Deployment Phase

### 3.1. Verification & Smoke Testing

- [ ] **Health Checks**: Perform basic health checks on the application (e.g., main page loads, API endpoints respond).
- [ ] **Smoke Tests**: Execute a small suite of critical path smoke tests (manual or automated) to verify core functionality.
  - [ ] User login/registration.
  - [ ] Key feature A (e.g., starting an assessment).
  - [ ] Key feature B (e.g., viewing a report).
  - [ ] Email sending (e.g., trigger a test notification).
- [ ] **Clear Caches (If Applicable)**: Clear any relevant CDN, browser, or application caches if necessary.

### 3.2. Monitoring & Observation

- [ ] **Monitor Logs**: Actively monitor application logs (Vercel, Supabase, Sentry) for any new or unusual errors.
- [ ] **Monitor Performance**: Check application performance dashboards for any degradation (response times, error rates, resource usage).
- [ ] **Monitor Third-Party Services**: Check dashboards for Resend, Supabase, etc., for any issues related to the new deployment.
- [ ] **Feature Flags (If Used)**: If new features are behind feature flags, monitor their behavior and gradually roll them out if stable.

### 3.3. Final Steps

- [ ] **Announce Deployment Completion**: Notify stakeholders of successful deployment.
- [ ] **Review Deployment Process**: After a stable period, conduct a brief review/retrospective of the deployment. Note any issues, lessons learned, and potential improvements for future deployments.
- [ ] **Close Deployment Task/Ticket**: Update project management tools.

---

This checklist should be adapted and updated as the application and its deployment process evolve.
