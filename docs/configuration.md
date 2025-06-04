# Application Configuration

This document outlines the environment variables used to configure the Pediatric Health Assessment application. These variables are typically set in a `.env` file in the project root during development, or through the hosting provider's environment variable settings in staging and production.

The configuration is managed by `src/shared/config/index.ts`, which validates and provides access to these settings.

## Database Configuration (`config.database`)

| Environment Variable            | `config` Path               | Description                                                         | Default Value |
| ------------------------------- | --------------------------- | ------------------------------------------------------------------- | ------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `database.url`              | The URL of your Supabase project.                                   | **Required**  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `database.anon_key`         | The anonymous public key for your Supabase project.                 | **Required**  |
| `SUPABASE_SERVICE_ROLE_KEY`     | `database.service_role_key` | The service role key for Supabase (optional, used for admin tasks). | Optional      |

## Email Configuration (`config.email`)

| Environment Variable | `config` Path          | Description                                   | Default Value                                   |
| -------------------- | ---------------------- | --------------------------------------------- | ----------------------------------------------- |
| `FROM_EMAIL`         | `email.from`           | The sender email address for outgoing emails. | `reports@pediatrichealth.app`                   |
| `RESEND_API_KEY`     | `email.resend_api_key` | The API key for the Resend email service.     | Optional (but required for email functionality) |

## Application Configuration (`config.app`)

| Environment Variable   | `config` Path     | Description                      | Default Value           |
| ---------------------- | ----------------- | -------------------------------- | ----------------------- |
| `NODE_ENV`             | `app.environment` | The application environment.     | `development`           |
| `NEXT_PUBLIC_BASE_URL` | `app.base_url`    | The base URL of the application. | `http://localhost:3000` |

## Authentication Configuration (`config.auth`)

| Environment Variable   | `config` Path       | Description                                 | Default Value           |
| ---------------------- | ------------------- | ------------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | `auth.redirect_url` | The redirect URL used after authentication. | `http://localhost:3000` |

## Practice Information Configuration (`config.practice`)

These settings are optional and are primarily used for branding in emails and reports.

| Environment Variable | `config` Path      | Description                         | Default Value                 |
| -------------------- | ------------------ | ----------------------------------- | ----------------------------- |
| `PRACTICE_NAME`      | `practice.name`    | The name of the pediatric practice. | `Pediatric Health Assessment` |
| `PRACTICE_LOGO`      | `practice.logo`    | URL to the practice's logo.         | Optional                      |
| `PRACTICE_ADDRESS`   | `practice.address` | Physical address of the practice.   | Optional                      |
| `PRACTICE_PHONE`     | `practice.phone`   | Phone number of the practice.       | Optional                      |
| `PRACTICE_WEBSITE`   | `practice.website` | Website URL of the practice.        | Optional                      |

---

Ensure all required environment variables are set correctly for the application to function as expected. Refer to `src/shared/config/index.ts` for the canonical schema and validation logic.
