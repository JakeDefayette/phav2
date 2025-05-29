# Personal Health Assistant (PHA) v2

## Project Description

The Personal Health Assistant (PHA) is a comprehensive tool designed to empower users in managing and improving their overall health and wellness. PHA provides a centralized platform for tracking various health metrics, setting personalized goals, and gaining insights into one's health journey. This application aims to make health management intuitive, accessible, and proactive.

## Purpose

The primary purpose of PHA is to help individuals take a proactive approach to their health. By enabling users to easily track and monitor their health data, PHA facilitates:
-   **Informed Decision Making:** Users can make better-informed decisions about their lifestyle, diet, and exercise routines based on tracked data and trends.
-   **Goal Achievement:** PHA assists users in setting and achieving realistic health and wellness goals.
-   **Early Detection:** Consistent tracking can help in identifying patterns or changes that might indicate potential health issues, encouraging early consultation with healthcare professionals.
-   **Motivation and Engagement:** By visualizing progress and providing insights, PHA aims to keep users motivated and engaged in their health journey.

## Target Audience

The target audience for PHA includes:
-   Individuals who are keen on actively managing their health and wellness.
-   People looking to adopt healthier habits and track their progress.
-   Users who want a simple yet effective tool to monitor various aspects of their health, such as physical activity, nutrition, sleep, and vital signs.
-   Individuals who may be managing chronic conditions and need a tool to keep track of their health parameters.

## Features

Key features of the Personal Health Assistant (PHA) include:

-   **User Authentication:** Secure login and registration functionality to protect user data.
-   **Health Surveys:** Customizable surveys to gather comprehensive health information.
-   **Report Generation:** Ability to generate health reports, potentially in PDF format, for personal review or sharing with healthcare providers.
-   **Interactive Dashboard:** A user-friendly dashboard to visualize health data, track trends, and monitor progress towards goals.
-   **Child Account Management:** Functionality for parents or guardians to manage the health information of their children.
-   **Practice Management:** Tools for healthcare practitioners to manage their practice and interact with their patients' health data (with consent).

## Technology Stack

The PHA application is built using the following technologies:

-   **Frontend:**
    -   Next.js: A React framework for server-side rendering and static site generation.
    -   React: A JavaScript library for building user interfaces.
    -   TypeScript: A typed superset of JavaScript that compiles to plain JavaScript.
    -   Tailwind CSS: A utility-first CSS framework for rapid UI development.
-   **Backend & Database:**
    -   Supabase: An open-source Firebase alternative for building secure and scalable backends.
    -   PostgreSQL: A powerful, open-source object-relational database system used by Supabase.
-   **Testing:**
    -   Jest: A delightful JavaScript Testing Framework with a focus on simplicity.
-   **Deployment:**
    -   Vercel: A platform for deploying and hosting modern web applications, with strong support for Next.js.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm (comes with Node.js)
-   Supabase CLI (See [Supabase CLI installation guide](https://supabase.com/docs/guides/cli/getting-started))

### Cloning the Repository

1.  Clone the repo:
    ```bash
    git clone https://github.com/your-username/pha-v2.git
    cd pha-v2
    ```

### Installing Dependencies

1.  Install NPM packages:
    ```bash
    npm install
    ```

### Supabase Local Development Setup

Setting up Supabase locally allows you to develop and test features without affecting a live environment.

1.  **Initialize Supabase:**
    If this is your first time setting up the project, initialize Supabase within your project directory:
    ```bash
    supabase init
    ```
    This command creates a `supabase` directory in your project. **Important:** Ensure this directory is added to your `.gitignore` file if it hasn't been already, as it may contain sensitive information.

2.  **Start Supabase Services:**
    Start all the Supabase services (database, Auth, Storage, etc.):
    ```bash
    supabase start
    ```
    Once started, Supabase will output your local Supabase URL, anon key, and service role key. You'll need these for your environment variables.

3.  **Set Up Environment Variables:**
    Create a `.env.local` file in the root of your project. Copy the contents of `.env.example` (if it exists) or add the following, replacing the placeholders with the values provided by `supabase start` or from your `docs/supabase-setup.md` if you are connecting to a remote Supabase project:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY # Only if needed for server-side operations

    # Application Configuration (adjust as necessary)
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    ```
    For more details on Supabase environment variables and initial cloud setup, refer to `docs/supabase-setup.md`.

4.  **Apply Database Migrations:**
    The database schema is managed through migrations located in the `supabase/migrations` directory. When you start Supabase locally, it should automatically apply any existing migrations.
    
    If you need to apply migrations manually or after pulling new changes that include new migrations, you can link your local CLI to your project ID (if you have one) and then apply migrations:
    ```bash
    # Only needed if you haven't done it before or are switching projects
    # supabase link --project-ref YOUR_PROJECT_ID 
    # supabase db push # (Use with caution, preferred for local dev or new remote changes)
    ```
    Alternatively, to reset your local database and apply all migrations:
    ```bash
    supabase db reset
    ```
    The project also includes a script to run migrations: `scripts/run-migrations.js`. This might be used for specific scenarios or CI/CD pipelines. Refer to `scripts/database-setup-instructions.md` for more context on database setup, especially for initial table structures like `user_profiles`.

### Running the Application

Once dependencies are installed and Supabase is running and configured:

```bash
npm run dev
```
This will start the Next.js development server, typically on `http://localhost:3000`.

## Running Tests

This project uses Jest for testing. Several types of tests are included to ensure application quality:

-   **Unit Tests:** Verify individual components and functions.
-   **Integration Tests:** Test the interaction between different parts of the application, such as services and data mappers.
-   **API Tests:** Validate the behavior of API endpoints.
-   **Database Tests:** Ensure database schema, queries, and data integrity. (Located in `tests/database/`)
-   **Accessibility Tests:** Check for accessibility issues in UI components. (Located in `tests/accessibility/`)

### Test Commands

You can run tests using the following npm scripts defined in `package.json`:

-   Run all tests:
    ```bash
    npm test
    ```
-   Run tests in watch mode (reruns tests on file changes):
    ```bash
    npm run test:watch
    ```
-   Generate a test coverage report:
    ```bash
    npm run test:coverage
    ```
-   Run database-specific tests:
    ```bash
    npm run test:db
    ```
-   Run service-specific tests:
    ```bash
    npm run test:services
    ```

Refer to the `scripts` section in `package.json` for a full list of available test commands and their configurations.

## Deployment

The application is deployed on Vercel. Vercel is a platform for static sites and Serverless Functions, well-suited for Next.js applications.

Key deployment aspects:
-   **Continuous Deployment:** Vercel typically integrates with the project's Git repository (e.g., GitHub, GitLab, Bitbucket). Pushes to specific branches (like `main` or `master`) can trigger automatic deployments to production, while pushes to other branches can create preview deployments.
-   **Configuration:** Deployment settings can be managed through the Vercel dashboard and potentially through the `vercel.json` file in the project root, which can define build commands, environment variables, routing rules, and other deployment-specific configurations.
-   **Serverless Functions:** Next.js API routes are often deployed as serverless functions on Vercel, allowing for scalable backend logic.

For more detailed deployment instructions, environment variable setup for different environments (production, preview, development), and any specific Vercel configurations, please refer to the `docs/deployment.md` file.

The `package.json` also contains deployment scripts:
- `npm run deploy`: Deploys to production on Vercel.
- `npm run deploy:preview`: Creates a preview deployment on Vercel.

## Usage

Usage instructions coming soon...

## Contributing

We welcome contributions to the Personal Health Assistant (PHA) project! To ensure a smooth and effective collaboration process, please follow these guidelines.

### Getting Started with Contributions

1.  **Fork the Repository:** Start by forking the main repository to your own GitHub account.
2.  **Clone your Fork:** Clone your forked repository to your local machine.
    ```bash
    git clone https://github.com/your-username/pha-v2.git
    cd pha-v2
    ```
3.  **Set Upstream Remote:** Add the original repository as the upstream remote to keep your fork updated.
    ```bash
    git remote add upstream https://github.com/original-username/pha-v2.git 
    # Replace original-username with the actual owner of the repository
    ```
4.  **Install Dependencies:** Ensure all project dependencies are installed:
    ```bash
    npm install
    ```

### Branching Strategy

-   **Main Branch:** The `main` branch is for stable, production-ready code. Direct pushes to `main` are typically restricted.
-   **Develop Branch (if applicable):** Some projects use a `develop` branch for integrating features. If it exists, base your feature branches off `develop`. Otherwise, use `main`.
-   **Feature Branches:** Create a new branch for each new feature or bug fix.
    -   Name your branches descriptively, e.g., `feature/user-authentication` or `fix/login-button-bug`.
    -   Branch off `develop` (if it exists) or `main`:
        ```bash
        git checkout -b feature/your-feature-name develop 
        # or git checkout -b feature/your-feature-name main
        ```

### Development Workflow

1.  **Pull Latest Changes:** Before starting work, ensure your `main` (or `develop`) branch is up-to-date with the upstream repository:
    ```bash
    git checkout main # or develop
    git pull upstream main # or develop
    ```
2.  **Create/Checkout your Feature Branch:**
    ```bash
    git checkout feature/your-feature-name
    # If you need to update it with the latest from main/develop:
    # git merge main # or develop
    ```
3.  **Code:** Make your changes, adhering to the project's coding standards.
4.  **Test:** Run relevant tests to ensure your changes don't break existing functionality and that new functionality is covered.
    ```bash
    npm test 
    # Or more specific tests like npm run test:db
    ```
5.  **Commit Changes:**
    -   Follow conventional commit message formats (e.g., `feat: Add user registration API`, `fix: Correct email validation`).
    -   Write clear and concise commit messages.
    -   The project uses Husky for pre-commit hooks which run linters and formatters. Ensure these checks pass. See `docs/git-hooks.md` for more details.

### Code Style and Quality

-   **Linting:** We use ESLint for identifying and reporting on patterns in JavaScript/TypeScript. Configuration is in `.eslintrc.json`.
    ```bash
    npm run lint # Check for linting issues
    npm run lint:fix # Attempt to automatically fix issues
    ```
-   **Formatting:** We use Prettier for consistent code formatting. Configuration is in `.prettierrc`. It's usually run automatically by pre-commit hooks, but you can run it manually:
    ```bash
    npm run format # Format all relevant files
    npm run format:check # Check formatting
    ```
-   **Type Checking:** Ensure your TypeScript code is type-safe.
    ```bash
    npm run type-check
    ```
-   **Git Hooks:** The project uses Husky for Git hooks (pre-commit, pre-push) to enforce code quality. These hooks run checks like linting, formatting, type checking, and building. For more details on the configured hooks and troubleshooting, refer to `docs/git-hooks.md`.

### Pull Request (PR) Process

1.  **Push to your Fork:** Once your feature is complete and tested, push your branch to your fork:
    ```bash
    git push origin feature/your-feature-name
    ```
2.  **Create a Pull Request:** Open a PR from your feature branch to the `main` (or `develop`) branch of the upstream repository.
    -   Provide a clear title and detailed description of the changes.
    -   Link to any relevant issues.
    -   Ensure all automated checks (CI builds, Vercel previews) pass.
3.  **Code Review:** Project maintainers and other contributors will review your PR. Be prepared to discuss your changes and make adjustments based on feedback.
4.  **Merge:** Once approved and all checks pass, your PR will be merged by a maintainer.

### Code of Conduct

Please note that this project may have a Code of Conduct (check for a `CODE_OF_CONDUCT.md` file). Participants are expected to adhere to it. (If no `CODE_OF_CONDUCT.md` is present, consider adding one based on a standard template like the Contributor Covenant).

By contributing, you agree that your contributions will be licensed under the project's license (ISC, as per `package.json`).

We appreciate your help in making PHA better!

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
