# Component Library - Atomic Design

This component library follows the **Atomic Design** methodology created by Brad Frost. It provides a systematic approach to building user interfaces by breaking them down into their basic building blocks.

## Directory Structure

```
src/components/
├── atoms/          # Basic building blocks
├── molecules/      # Simple groups of UI elements
├── organisms/      # Complex UI components
├── templates/      # Page-level layouts
├── pages/          # Specific page implementations
└── index.ts        # Barrel exports
```

## Atomic Design Levels

### 🔬 Atoms (`./atoms/`)

Basic building blocks of the interface. These are the smallest functional units that can't be broken down further without losing their meaning.

**Current Components:**

- **Button** - Interactive button with variants (primary, secondary, outline, ghost, destructive) and sizes
- **Input** - Form input field with validation states and helper text
- **Label** - Text labels with variants (default, required, optional)

**Characteristics:**

- Single responsibility
- Highly reusable
- No dependencies on other components
- Include basic styling and behavior

### 🧪 Molecules (`./molecules/`)

Simple groups of atoms functioning together as a unit. They have their own properties and serve as the backbone of design systems.

**Current Components:**

- **FormField** - Combines Label and Input atoms for form fields
- **Card** - Container component with variants and padding options

**Characteristics:**

- Combine 2-3 atoms
- Have a single, well-defined purpose
- Reusable across different contexts
- May have simple state management

### 🦠 Organisms (`./organisms/`)

Complex UI components composed of groups of molecules and/or atoms. They form distinct sections of an interface.

**Current Components:**

- **Header** - Navigation header with logo, title, menu, and actions
- **Form** - Complete form wrapper with validation and submission handling

**Characteristics:**

- Combine multiple molecules and atoms
- Have complex functionality and state
- Represent distinct interface sections
- May connect to external data sources

### 📄 Templates (`./templates/`)

Page-level objects that place components into a layout and articulate the design's underlying content structure.

**Current Components:**

- **PageLayout** - Full page layout with header, main content, sidebar, and footer

**Characteristics:**

- Define page structure and layout
- Focus on content structure, not content itself
- Provide consistent layouts across pages
- Handle responsive behavior

### 📱 Pages (`./pages/`)

Specific instances of templates with real representative content. They show what a UI looks like with actual content.

**Current Status:**

- Directory structure created
- Ready for specific page implementations
- Should use templates as base layouts

**Characteristics:**

- Specific instances of templates
- Include real content and data
- Handle page-specific business logic
- Connect to data sources and APIs

## Usage Examples

### Using Individual Components

```tsx
import { Button, Input, Label } from '@/components';

function MyForm() {
  return (
    <div>
      <Label htmlFor='email' variant='required'>
        Email
      </Label>
      <Input
        id='email'
        type='email'
        placeholder='Enter your email'
        variant='default'
      />
      <Button variant='primary' size='md'>
        Submit
      </Button>
    </div>
  );
}
```

### Using Molecules

```tsx
import { FormField, Card } from '@/components';

function LoginForm() {
  return (
    <Card variant='outlined' padding='lg'>
      <FormField
        label='Email'
        id='email'
        type='email'
        required
        placeholder='Enter your email'
      />
      <FormField
        label='Password'
        id='password'
        type='password'
        required
        placeholder='Enter your password'
      />
    </Card>
  );
}
```

### Using Organisms

```tsx
import { Header, Form } from '@/components';

function App() {
  return (
    <div>
      <Header
        title='My App'
        showMenu
        actions={[
          { label: 'Login', onClick: () => {} },
          { label: 'Sign Up', onClick: () => {} },
        ]}
      />
      <Form onSubmit={handleSubmit}>{/* Form content */}</Form>
    </div>
  );
}
```

### Using Templates

```tsx
import { PageLayout } from '@/components';

function HomePage() {
  return (
    <PageLayout
      headerProps={{
        title: 'Welcome',
        showMenu: true,
      }}
      showSidebar={false}
    >
      <h1>Welcome to our application!</h1>
      <p>This is the main content area.</p>
    </PageLayout>
  );
}
```

## Design System Integration

### Styling Approach

- **Tailwind CSS** for utility-first styling
- **Class Name Utility** (`cn`) for conditional and merged classes
- **Consistent Design Tokens** across all components
- **Responsive Design** built into components

### TypeScript Support

- Full TypeScript interfaces for all components
- Exported types for external usage
- Proper prop validation and IntelliSense support

### Accessibility

- ARIA attributes where appropriate
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Development Guidelines

### Creating New Components

1. **Identify the Atomic Level** - Determine where your component fits
2. **Follow Naming Conventions** - Use PascalCase for components
3. **Create Component Directory** - Include component file, index, and types
4. **Export from Level Index** - Add to the appropriate level's index file
5. **Update Main Index** - Add to the main components index file

### Component Structure

```
ComponentName/
├── ComponentName.tsx    # Main component file
├── index.ts            # Export file
└── types.ts            # Type definitions (if complex)
```

### Best Practices

- **Single Responsibility** - Each component should have one clear purpose
- **Composition over Inheritance** - Build complex components by combining simpler ones
- **Prop Drilling Avoidance** - Use context or state management for deep data passing
- **Performance Optimization** - Use React.memo, useMemo, and useCallback when needed
- **Testing** - Write unit tests for all components
- **Documentation** - Include JSDoc comments for complex components

## Utilities

### Class Name Utility (`cn`)

A utility function for merging Tailwind CSS classes with proper conflict resolution:

```tsx
import { cn } from '@/utils/cn';

// Merges classes and resolves conflicts
const className = cn(
  'bg-blue-500 text-white',
  'hover:bg-blue-600',
  isActive && 'bg-blue-700',
  customClassName
);
```

## Next Steps

1. **Add More Atoms** - Create additional basic components (Badge, Avatar, Icon, etc.)
2. **Expand Molecules** - Build more complex combinations (SearchBox, Pagination, etc.)
3. **Create Organisms** - Develop feature-rich components (DataTable, Navigation, etc.)
4. **Build Templates** - Design various page layouts (Dashboard, Auth, etc.)
5. **Implement Pages** - Create specific page implementations
6. **Add Storybook** - Document components with interactive examples
7. **Write Tests** - Add comprehensive test coverage
8. **Performance Optimization** - Implement code splitting and lazy loading

## Resources

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
