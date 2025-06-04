# EmailService API Documentation

## Overview

The `EmailService` provides comprehensive email functionalities for the Pediatric Health Assessment platform. It handles sending various types of emails (e.g., report delivery, notifications), scheduling emails for future delivery, managing email templates, tracking email engagement (opens, clicks), and handling suppression lists (bounces, unsubscribes).

It integrates with:

- **Resend**: For the actual dispatch of emails.
- **Supabase**: For logging email events and potentially other persistent storage needs related to email.
- **Internal Services**: Such as `EmailTemplateService` for rendering email content from React Email templates, and `emailTrackingService` for managing tracking pixels and links.

The service is designed to be robust, with error handling for common issues like configuration problems, authentication failures, rate limits, and delivery errors.

## Setup

To use the `EmailService` effectively, ensure the relevant environment variables are configured as outlined in the main [Application Configuration document](mdc:docs/configuration.md). Key variables for the email service include:

- `RESEND_API_KEY`
- `FROM_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL` (for logging, if applicable)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for logging, if applicable)
- Optional `PRACTICE_NAME`, `PRACTICE_LOGO_URL`, etc., for email template branding (see `config.practice` in the configuration document).

Ensure that the domain used in `FROM_EMAIL` is verified with Resend.

## Authentication

- **Resend Authentication**: The `EmailService` uses the `RESEND_API_KEY` to authenticate with the Resend API. This key is typically initialized once when the `resendClient` is created.
- **Supabase Authentication**: The service interacts with Supabase using the provided Supabase URL and anonymous key, usually via a shared Supabase client instance. Operations are performed based on the application's security policies and RLS (Row Level Security) rules configured in Supabase.

## Rate Limiting

The `EmailService` is subject to rate limits imposed by Resend.

- If an email sending attempt is rate-limited, the methods like `sendReportDeliveryEmail` or `sendReportReadyNotification` will throw an `EmailRateLimitError` or return an `EmailResult` object with `rateLimited: true` and an appropriate error message.
- You can check the current rate limit status by calling `emailService.getRateLimitStatus()`. This method returns an object indicating available sending tokens, the next refill time, and whether the service is currently limited.

```typescript
import { emailService } from '@/shared/services/email'; // Assuming singleton export

const status = emailService.getRateLimitStatus();
if (status.isLimited) {
  console.warn(
    `Email service is currently rate limited. Next refill: ${status.nextRefillTime}`
  );
}
```

## Key Usage Examples

### Sending a Report Delivery Email

This email typically includes a PDF attachment of an assessment report and a download link.

```typescript
import {
  emailService,
  EmailAttachment,
  ReportDeliveryEmailOptions,
} from '@/shared/services/email';

async function sendReport(
  recipientEmail: string,
  childName: string,
  reportUrl: string,
  pdfContent: Buffer
) {
  const options: ReportDeliveryEmailOptions = {
    to: recipientEmail,
    childName: childName,
    assessmentDate: new Date().toLocaleDateString(),
    downloadUrl: reportUrl,
    pdfAttachment: {
      filename: `${childName}_Assessment_Report.pdf`,
      content: pdfContent, // Buffer or base64 string
    },
    // practiceId is optional, used for enhanced tracking
    // practiceId: 'your-practice-id'
  };

  try {
    const result = await emailService.sendReportDeliveryEmail(options);
    if (result.success) {
      console.log(
        `Report delivery email sent successfully! Message ID: ${result.messageId}`
      );
    } else {
      console.error(`Failed to send report delivery email: ${result.error}`);
      if (result.rateLimited) {
        console.warn('Sending was rate limited.');
      }
    }
  } catch (error) {
    console.error('An unexpected error occurred while sending email:', error);
  }
}
```

### Scheduling a Report Ready Notification

This sends an email at a future time to notify a user that their report is available.

```typescript
import {
  emailService,
  ReportReadyNotificationOptions,
} from '@/shared/services/email';

async function scheduleNotification(
  userEmail: string,
  userName: string,
  reportId: string,
  viewLink: string
) {
  const scheduleOptions = {
    to: userEmail,
    firstName: userName,
    reportId: reportId,
    downloadUrl: viewLink,
    practiceId: 'your-practice-id', // Required for scheduling context
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for 24 hours from now
    priority: 'medium' as const,
  };

  try {
    const result =
      await emailService.scheduleReportReadyNotification(scheduleOptions);
    if (result.success) {
      console.log(
        `Report ready notification scheduled! Scheduled ID: ${result.scheduledEmailId}`
      );
    } else {
      console.error(`Failed to schedule notification: ${result.error}`);
    }
  } catch (error) {
    console.error('An unexpected error occurred during scheduling:', error);
  }
}
```

### Checking if an Email is Suppressed

Before sending an important email, you might want to check if the recipient is on a suppression list.

```typescript
import { emailService } from '@/shared/services/email';

async function checkSuppression(email: string, practiceId: string) {
  try {
    const result = await emailService.isEmailSuppressed(practiceId, email);
    if (result.success) {
      if (result.suppressed) {
        console.log(`${email} is suppressed.`);
      } else {
        console.log(`${email} is not suppressed. Safe to send.`);
      }
    } else {
      console.error(`Failed to check suppression status: ${result.error}`);
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}
```

## Error Handling

The `EmailService` methods are designed to return `EmailResult` objects or specific promises that indicate success or failure. In case of failure, an `error` property will contain a message. For critical issues or invalid configurations, specific error classes may be thrown:

- `EmailConfigurationError`: If the service (e.g., Resend client) is not properly configured.
- `EmailAuthenticationError`: For authentication issues with the email provider.
- `EmailRateLimitError`: If an email sending attempt is rate-limited.
- `EmailValidationError`: For invalid input parameters to service methods (though often caught by TypeScript).
- `EmailDeliveryError`: For general failures during email delivery reported by the provider.

It's recommended to use `try...catch` blocks when calling service methods and to inspect the `success`, `error`, and `rateLimited` properties of the returned objects.

## Further Details

For detailed information on each method's parameters and behavior, refer to the JSDoc comments directly within the `src/shared/services/email.ts` file.
