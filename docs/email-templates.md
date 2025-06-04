# Email Template Usage Guide

## Overview

The Pediatric Health Assessment platform uses React Email components for creating and rendering email templates. The `EmailTemplateService` (located in `src/shared/services/email/templates.ts`) is responsible for managing and rendering these templates.

Emails are rendered to both HTML and plain text. Each registered template also has fallback content in case the React component rendering fails.

## Available Templates & Their Props

The `EmailTemplateService` uses an `EmailTemplateType` enum to identify templates. Here are the primary templates and the props they expect:

1.  **`EmailTemplateType.REPORT_DELIVERY`**

    - **Component**: `ReportDeliveryTemplate` (from `src/shared/services/email/templates/ReportDelivery.tsx`)
    - **Purpose**: Used for sending an email when an assessment report is ready to be delivered, often with a PDF attachment.
    - \*\*Props (`ReportDeliveryTemplateProps` from `src/shared/services/email/templates/index.ts` via `./types`):
      - `childName: string`: The name of the child the report is for.
      - `assessmentDate: string`: The date of the assessment (formatted as a string).
      - `downloadUrl: string`: The URL from which the full report can be downloaded.
      - `hasAttachment?: boolean`: Indicates if a PDF attachment is included with the email.
      - `practiceInfo?: PracticeInfo`: Optional information about the practice (name, logo, address, phone, website).
        - `name?: string`
        - `logo?: string` (URL)
        - `address?: string`
        - `phone?: string`
        - `website?: string` (URL)

2.  **`EmailTemplateType.REPORT_READY`**
    - **Component**: `ReportReadyTemplate` (from `src/shared/services/email/templates/ReportReady.tsx`)
    - **Purpose**: Used to notify a user (e.g., parent or practitioner) that an assessment report is ready for viewing or download.
    - \*\*Props (`ReportReadyTemplateProps` from `src/shared/services/email/templates/index.ts` via `./types`):
      - `firstName: string`: The first name of the recipient.
      - `reportId: string`: The ID of the report that is ready.
      - `downloadUrl: string`: The URL from which the report can be accessed/downloaded.
      - `expiresAt?: string`: Optional expiration date/time for the download link (formatted as a string).
      - `practiceInfo?: PracticeInfo`: Optional information about the practice.

### Placeholder Templates

The following templates are registered but currently use `ReportDeliveryTemplate` as a placeholder component. They would need their own dedicated React components and prop types for full functionality:

- `EmailTemplateType.WELCOME`
  - Expected Data: User's name, welcome message, link to platform.
- `EmailTemplateType.PASSWORD_RESET`
  - Expected Data: User's name, password reset link, link expiration time.
- `EmailTemplateType.ACCOUNT_VERIFICATION`
  - Expected Data: User's name, account verification link.
- `EmailTemplateType.ASSESSMENT_REMINDER`
  - Expected Data: User's name, child's name, assessment date/time, link to assessment.
- `EmailTemplateType.SYSTEM_NOTIFICATION`
  - Expected Data: Notification title, message content, relevant links.
- `EmailTemplateType.REPORT_SHARE`
  - Expected Data: Sharer's name, recipient's name, report name/child, link to shared report.

## Dynamic Data in Templates

Dynamic data is passed to email templates via the `props` object when `EmailTemplateService.renderTemplate()` (or its specific wrappers like `renderReportDelivery()`) is called. Inside the React template components (`.tsx` files), these props are used to render the content dynamically.

For example, in `ReportDelivery.tsx`:

```tsx
// Simplified example from a template component
export const ReportDeliveryTemplate: React.FC<ReportDeliveryTemplateProps> = ({
  childName,
  assessmentDate,
  downloadUrl,
}) => {
  return (
    <BaseTemplate previewText='Your assessment report is here!'>
      <Text>Dear Parent/Guardian,</Text>
      <Text>
        The assessment report for {childName}, conducted on {assessmentDate}, is
        now available.
      </Text>
      <Button href={downloadUrl}>Download Report</Button>
    </BaseTemplate>
  );
};
```

## Customization

### Modifying Existing Templates

To modify an existing template (e.g., change its layout, styling, or text):

1.  Locate the corresponding `.tsx` file in `src/shared/services/email/templates/` (e.g., `ReportDelivery.tsx`).
2.  Edit the React component as needed. These components use standard React and often leverage elements from `@react-email/components` (like `<Text>`, `<Button>`, `<Html>`).
3.  The `BaseTemplate.tsx` often provides a common structure (header, footer, styling) that can also be modified to affect all templates using it.

### Creating and Registering New Templates

To add a new email template:

1.  **Define Props**: Determine the data your new template will need and define a TypeScript interface for its props (e.g., `MyNewTemplateProps`).
2.  **Create Component**: Create a new React Email component (e.g., `MyNewTemplate.tsx`) in `src/shared/services/email/templates/`. This component should accept your defined props.

    ```tsx
    // src/shared/services/email/templates/MyNewTemplate.tsx
    import React from 'react';
    import { BaseTemplate } from './BaseTemplate';
    import { Text } from '@react-email/components';

    export interface MyNewTemplateProps {
      userName: string;
      customMessage: string;
    }

    export const MyNewTemplate: React.FC<MyNewTemplateProps> = ({
      userName,
      customMessage,
    }) => {
      return (
        <BaseTemplate previewText='A new notification for you!'>
          <Text>Hello {userName},</Text>
          <Text>{customMessage}</Text>
        </BaseTemplate>
      );
    };
    ```

3.  **Update Types**: Add your new props type to the `EmailTemplateData` union in `src/shared/services/email/types.ts` (or where it's defined, often near `EmailTemplateType`). Add your new template to the `EmailTemplateType` enum.

    ```typescript
    // In src/shared/services/email/types.ts (or similar)
    export enum EmailTemplateType {
      // ... existing types
      MY_NEW_TEMPLATE = 'my_new_template',
    }

    // In src/shared/services/email/templates.ts (or types file)
    // Add MyNewTemplateProps to the EmailTemplateData union
    export type EmailTemplateData =
      | ReportDeliveryTemplateProps
      | ReportReadyTemplateProps
      | MyNewTemplateProps // <-- Add here
      | Record<string, any>;
    ```

4.  **Register Template**: In `src/shared/services/email/templates.ts`, import your new component and register it in the `templateRegistry`.

    ```typescript
    // In src/shared/services/email/templates.ts
    import { MyNewTemplate, MyNewTemplateProps } from './templates/MyNewTemplate'; // Adjust path if needed

    // ... inside templateRegistry
    [EmailTemplateType.MY_NEW_TEMPLATE]: {
      component: MyNewTemplate,
      defaultSubject: 'You Have a New Message',
      fallbackHtml: `<p>You have a new message. Please check the platform.</p>`,
      fallbackText: 'You have a new message. Please check the platform.',
    },
    ```

5.  **Add Wrapper (Optional)**: Optionally, add a specific rendering method to `EmailTemplateService` for convenience:
    ```typescript
    // In src/shared/services/email/templates.ts, inside EmailTemplateService class
    static async renderMyNewTemplate(
      props: MyNewTemplateProps
    ): Promise<{ html: string; text: string; subject: string }> {
      return this.renderTemplate(EmailTemplateType.MY_NEW_TEMPLATE, props);
    }
    ```

## Structure of a Template Component

Email template components are standard React functional components. They typically:

- Import necessary elements from `@react-email/components` (e.g., `Html`, `Head`, `Preview`, `Body`, `Container`, `Section`, `Text`, `Link`, `Button`, `Img`).
- Use `BaseTemplate.tsx` for common layout and styling (e.g., consistent header, footer, fonts).
- Receive props containing the dynamic data to be rendered.
- Return JSX that defines the email structure.

Example from `BaseTemplate.tsx` (simplified):

```tsx
import React from 'react';
import { Html, Head, Body, Container, Tailwind } from '@react-email/components';

interface BaseTemplateProps {
  children: React.ReactNode;
  previewText: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  children,
  previewText,
}) => {
  return (
    <Html>
      <Head />
      {/* <Preview>{previewText}</Preview> */}
      <Tailwind>
        <Body style={main}>
          <Container style={container}>
            {/* Optional Header could go here */}
            {children}
            {/* Optional Footer could go here */}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' };
```

## Fallback Content

If rendering a React Email template component fails for any reason (e.g., an error within the component, missing data that causes a crash), the `EmailTemplateService` will use the `fallbackHtml` and `fallbackText` defined for that template in the `templateRegistry`.
This ensures that the user still receives a basic email instead of a completely broken one or no email at all.

---

This guide should help developers understand, use, and customize email templates within the application. For specific prop details of each template component, refer to their respective `.tsx` files and associated type definitions.
