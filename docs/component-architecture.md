# Feature-Based Component Architecture

This document outlines the component architecture implemented in the PHA-v2 application, following a feature-based organization pattern that promotes modularity, maintainability, and scalability.

## Architecture Overview

Our component architecture is organized around **features** rather than strict atomic design patterns. This approach provides:

- **Feature Isolation**: Related code is co-located within feature directories
- **Shared Reusability**: Common components are organized for cross-feature use
- **Clear Boundaries**: Feature-specific code stays within features, shared code in shared directories
- **Scalability**: Easy to add new features without affecting existing ones

## Directory Structure

```
src/
├── shared/                          # Shared across all features
│   ├── components/                  # Reusable UI components
│   │   ├── atoms/                   # Basic UI elements
│   │   ├── molecules/               # Simple combinations
│   │   ├── organisms/               # Complex combinations
│   │   ├── templates/               # Page layouts
│   │   └── index.ts                 # Organized exports
│   ├── hooks/                       # Generic custom hooks
│   ├── services/                    # Core services (auth, API, etc.)
│   ├── types/                       # Global type definitions
│   └── utils/                       # Helper functions
└── features/                        # Feature-specific modules
    ├── dashboard/                   # Dashboard feature
    │   ├── components/              # Dashboard-specific components
    │   │   ├── widgets/             # Dashboard widgets
    │   │   ├── charts/              # Dashboard charts
    │   │   ├── forms/               # Dashboard forms
    │   │   └── index.ts             # Feature component exports
    │   ├── hooks/                   # Dashboard-specific hooks
    │   ├── services/                # Dashboard business logic
    │   ├── types/                   # Dashboard type definitions
    │   └── index.ts                 # Feature module exports
    └── [other-features]/            # Other feature modules
```

This architecture demonstrates the feature-based approach implemented in task 9.2.
