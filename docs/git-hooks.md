# Git Hooks with Husky

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality standards through Git hooks.

## Overview

Git hooks are scripts that run automatically at certain points in the Git workflow. We use them to:

- Maintain consistent code quality
- Prevent broken code from being committed
- Ensure builds pass before pushing to remote repositories

## Configured Hooks

### Pre-commit Hook

**Location**: `.husky/pre-commit`

**Purpose**: Runs code quality checks before each commit

**Checks performed**:

- **ESLint**: Linting for JavaScript/TypeScript code
- **Prettier**: Code formatting verification
- **TypeScript**: Type checking

**Command**: `npm run code-quality`

If any of these checks fail, the commit will be blocked until the issues are resolved.

### Pre-push Hook

**Location**: `.husky/pre-push`

**Purpose**: Ensures the code builds successfully before pushing to remote

**Checks performed**:

- **Next.js Build**: Full production build verification
- **Type checking**: Included in the build process
- **Static analysis**: Ensures all imports and dependencies are valid

**Command**: `npm run build`

If the build fails, the push will be blocked.

## Available Scripts

The following npm scripts are used by the Git hooks:

```bash
# Run all code quality checks
npm run code-quality

# Individual checks
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without changes
npm run type-check    # TypeScript type checking

# Build verification
npm run build         # Production build
```

## Bypassing Hooks (Emergency Use Only)

In rare cases where you need to bypass the hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency commit"

# Skip pre-push hook
git push --no-verify
```

**⚠️ Warning**: Only use `--no-verify` in emergency situations. Always fix the underlying issues as soon as possible.

## Troubleshooting

### Common Issues

1. **Formatting errors**: Run `npm run format` to auto-fix
2. **Linting errors**: Run `npm run lint:fix` for auto-fixable issues
3. **Type errors**: Check TypeScript compilation with `npm run type-check`
4. **Build failures**: Run `npm run build` locally to debug

### Hook Not Running

If hooks aren't running:

1. Ensure Husky is installed: `npm run prepare`
2. Check hook permissions: `chmod +x .husky/pre-commit .husky/pre-push`
3. Verify you're in a Git repository: `git status`

### Performance

The hooks are designed to be fast:

- Pre-commit: ~5-10 seconds for code quality checks
- Pre-push: ~15-30 seconds for full build

## Configuration

### Husky Configuration

Husky is configured through:

- `package.json`: Contains the `prepare` script
- `.husky/` directory: Contains individual hook scripts

### Code Quality Configuration

- **ESLint**: `.eslintrc.json`
- **Prettier**: `.prettierrc` and `.prettierignore`
- **TypeScript**: `tsconfig.json`

## Benefits

1. **Consistent Code Quality**: All team members follow the same standards
2. **Early Error Detection**: Catch issues before they reach the repository
3. **Automated Enforcement**: No manual intervention required
4. **Build Confidence**: Ensures pushes contain working code
5. **Reduced CI/CD Failures**: Catch issues locally before remote builds

## Team Workflow

1. **Development**: Write code following project standards
2. **Commit**: Git hooks automatically verify code quality
3. **Push**: Build verification ensures deployable code
4. **Collaboration**: All team members benefit from consistent quality

This setup ensures that our codebase maintains high quality standards while supporting the modular architecture principles outlined in the project requirements.
