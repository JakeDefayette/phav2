# Email Service Troubleshooting Guide

This guide provides help with common error scenarios, their causes, and troubleshooting steps for the Email Service in the Pediatric Health Assessment platform.

## General Approach to Troubleshooting

1.  **Check Logs**: 
    *   **Application Logs**: Look for console errors or specific log entries related to the `EmailService` or Resend client.
    *   **Supabase `email_sends` Table**: This table logs attempts to send emails, their status (`sent`, `failed`, `bounced`, etc.), and any `messageId` from Resend or error messages. Query this table for the recipient or `messageId`.
    *   **Resend Dashboard**: Log in to your Resend account. The dashboard provides detailed logs for each email attempt, including delivery status, events (opens, clicks, bounces), and error messages from their system.
2.  **Verify Configuration**: Ensure all required environment variables are correctly set as per [Application Configuration document](mdc:docs/configuration.md). Pay special attention to `RESEND_API_KEY` and `FROM_EMAIL`.
3.  **Test Connection**: Use `emailService.testConnection()` to check basic connectivity to Resend.
4.  **Send Test Email**: Use `emailService.sendTestEmail('your-test-address@example.com')` to a controlled email address to see if basic sending works.
5.  **Isolate the Issue**: Determine if the problem is with template rendering, data preparation, Resend API communication, or email delivery itself.

## Common Error Scenarios and Solutions

### 1. `EmailConfigurationError`

*   **Symptom**: Error message like "Resend API not configured", "Resend client not configured", or errors related to invalid API key format.
*   **Potential Causes**:
    *   `RESEND_API_KEY` environment variable is missing, empty, or incorrect.
    *   The `resendClient` in `src/shared/services/email/resend.ts` failed to initialize.
    *   Domain used in `FROM_EMAIL` is not verified in Resend.
*   **Troubleshooting Steps**:
    1.  Verify `RESEND_API_KEY` is correctly set in your `.env` file or hosting environment variables and matches the key from your Resend dashboard.
    2.  Ensure the domain of the `FROM_EMAIL` (e.g., `yourdomain.com` if from is `noreply@yourdomain.com`) is added and verified in the "Domains" section of your Resend account.
    3.  Check application startup logs for any errors during `resendClient` initialization.
    4.  Run `await emailService.testConnection();` to see if it reports a configuration issue.

### 2. `EmailAuthenticationError`

*   **Symptom**: Error messages indicating authentication failure with Resend (e.g., "Invalid API Key", 401/403 errors from Resend).
*   **Potential Causes**:
    *   The `RESEND_API_KEY` is incorrect, revoked, or does not have the necessary permissions.
*   **Troubleshooting Steps**:
    1.  Double-check the `RESEND_API_KEY` against the one in your Resend dashboard.
    2.  Generate a new API key in Resend if you suspect the current one is compromised or invalid, and update your environment variable.
    3.  Ensure there are no typos or extra characters in the copied API key.

### 3. `EmailRateLimitError`

*   **Symptom**: Error message like "Rate limit exceeded" or specific Resend rate limit errors (e.g., 429 status code).
*   **Potential Causes**:
    *   Exceeding the sending limits (e.g., emails per second/minute/day) imposed by your Resend account plan.
    *   Sudden bursts of high email volume.
*   **Troubleshooting Steps**:
    1.  Check the Resend dashboard for your current rate limits and usage.
    2.  Use `emailService.getRateLimitStatus()` to check the current token availability and refill time programmatically.
    3.  Implement retry logic with exponential backoff in your application when this error is caught.
    4.  If consistently hitting rate limits, consider upgrading your Resend plan or optimizing email sending patterns (e.g., batching, spreading out sends).
    5.  Review the `EmailService` logic; it should ideally throw this specific error or indicate `rateLimited: true` in its result.

### 4. `EmailValidationError`

*   **Symptom**: Errors indicating invalid input parameters, such as malformed email addresses, missing required fields for templates, or incorrect data types.
*   **Potential Causes**:
    *   Incorrect or missing `to`, `from`, or `subject` fields.
    *   Invalid email address format (e.g., `user@example` instead of `user@example.com`).
    *   Missing required data for a specific email template (e.g., `childName` for `ReportDeliveryTemplate`).
    *   Incorrect attachment format or content.
*   **Troubleshooting Steps**:
    1.  Carefully check the parameters being passed to the `EmailService` methods (e.g., `sendReportDeliveryEmail`, `sendReportReadyNotification`).
    2.  Validate email addresses for correct format before attempting to send.
    3.  Ensure all required props for the specific email template being used are provided and are of the correct type. Refer to [Email Template Usage Guide](mdc:docs/email-templates.md).
    4.  If providing attachments, ensure the `filename` and `content` (Buffer or base64 string) are correct.

### 5. `EmailDeliveryError`

*   **Symptom**: General failure reported by Resend after accepting the email, but failing to deliver it to the recipient's mail server. Examples: "Failed to send email", Resend error codes indicating delivery issues.
*   **Potential Causes**:
    *   Recipient email address does not exist or mailbox is full (hard bounce).
    *   Recipient's mail server is temporarily unavailable or rejecting emails (soft bounce).
    *   Email content flagged as spam by recipient's mail server.
    *   Issues with DNS records (SPF, DKIM, DMARC) for your sending domain, leading to poor deliverability.
    *   Recipient has previously unsubscribed or marked emails as spam (check suppression list).
*   **Troubleshooting Steps**:
    1.  Check the Resend dashboard for specific error details associated with the `messageId`.
    2.  Verify the recipient's email address for typos.
    3.  Check your sending domain's DNS records (SPF, DKIM, DMARC) to ensure they are correctly configured and validated in Resend. This is crucial for deliverability.
    4.  Review email content for potential spam triggers (e.g., excessive capitalization, misleading subject lines, too many links to untrusted domains).
    5.  Use `emailService.isEmailSuppressed()` to check if the recipient is on a suppression list before re-attempting.
    6.  Monitor bounce rates in Resend. High bounce rates can damage your sender reputation.

### 6. Emails Not Being Received (No Specific Error)

*   **Symptom**: Application reports email sent successfully (you have a `messageId`), but the recipient does not receive it (not even in spam).
*   **Potential Causes**:
    *   Deliverability issues (SPF, DKIM, DMARC not set up correctly or not propagated).
    *   Email content being aggressively filtered by corporate firewalls or spam filters.
    *   Recipient email server issues (less common if Resend reports delivery).
    *   Incorrect recipient email address provided initially.
*   **Troubleshooting Steps**:
    1.  **Confirm `messageId`**: Ensure your application logged a `messageId` from Resend.
    2.  **Check Resend Logs**: Use the `messageId` to find the email in the Resend dashboard. Check its status and event history. Resend often provides detailed delivery events.
    3.  **Verify DNS**: This is the most common cause. Ensure SPF, DKIM, and DMARC records for your sending domain are correctly set up in your DNS provider and are green/verified in the Resend dashboard.
    4.  **Test with Different Recipients**: Send to other email addresses (e.g., Gmail, Outlook) to see if it's a recipient-specific issue.
    5.  **Check Spam/Junk Folders**: Ask the recipient to check thoroughly.
    6.  **Simplify Content**: Send a plain text email with minimal content to the problematic recipient to rule out content-based filtering.
    7.  **Review Sender Reputation**: Check if your sending domain or IP has a poor reputation (tools like SenderScore.org).

### 7. Template Rendering Issues

*   **Symptom**: Email is sent, but the content is the fallback HTML/text, or the layout is broken.
*   **Potential Causes**:
    *   Error within the React Email template component (`.tsx` file).
    *   Missing or incorrect props passed to the template.
    *   Issues with `BaseTemplate.tsx` if used.
*   **Troubleshooting Steps**:
    1.  Review application logs for any errors from `EmailTemplateService.renderTemplate()`.
    2.  Test the template rendering locally using `EmailTemplateService.testTemplate(templateType)` if available, or by directly rendering the component with sample data.
    3.  Ensure all required props for the specific template are being passed correctly from the `EmailService` methods.
    4.  Check the template files for JSX errors or issues with React Email components.
    5.  If using Tailwind CSS in templates (via `@react-email/tailwind`), ensure it's configured correctly.

## Interpreting Logs

*   **`email_sends` table (Supabase)**:
    *   `recipient_email`: Who the email was for.
    *   `template_type`: Which template was used.
    *   `status`: `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `failed`.
    *   `message_id`: The ID from Resend, crucial for cross-referencing.
    *   `error`: Any error message captured by the application during the send attempt.
    *   `sent_at`, `opened_at`, `clicked_at`: Timestamps for events.
*   **Resend Dashboard Logs**: Provides the most detailed view of what happened after Resend accepted the email. Look for delivery events, bounce reasons, and spam complaints.

---

If issues persist, consult the official Resend documentation and support channels. Ensure your application-level logging provides enough context to trace email sending attempts and their outcomes. 