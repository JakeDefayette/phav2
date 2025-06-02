import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Img,
  Link,
  Preview,
} from '@react-email/components';

export interface ReportReadyTemplateProps {
  firstName: string;
  reportId: string;
  downloadUrl?: string;
  expiresAt?: Date;
  practiceInfo?: {
    name?: string;
    logo?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
}

export const ReportReadyTemplate: React.FC<ReportReadyTemplateProps> = ({
  firstName,
  reportId,
  downloadUrl,
  expiresAt,
  practiceInfo,
}) => {
  const previewText = `${firstName}, your Pediatric Health Assessment Report is ready for download`;

  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {practiceInfo?.logo && (
              <Img
                src={practiceInfo.logo}
                alt={practiceInfo.name || 'Practice Logo'}
                style={logo}
              />
            )}
            <Heading style={headerTitle}>Your Report is Ready!</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hello {firstName},</Text>

            <Text style={paragraph}>
              Great news! Your Pediatric Health Assessment Report has been
              completed and is now ready for download.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightText}>
                🎉 <strong>Report ID:</strong> {reportId}
              </Text>
              <Text style={highlightSubtext}>
                Your comprehensive health assessment is complete
              </Text>
            </Section>

            {downloadUrl && (
              <>
                <Text style={paragraph}>
                  Click the button below to securely access and download your
                  report:
                </Text>

                <Section style={buttonContainer}>
                  <Button style={button} href={downloadUrl}>
                    Download Your Report
                  </Button>
                </Section>
              </>
            )}

            {expiresAt && (
              <Section style={warningBox}>
                <Text style={warningText}>
                  ⏰ <strong>Important:</strong> This download link will expire
                  on <strong>{formatExpiryDate(expiresAt)}</strong>. Please
                  download your report before this date.
                </Text>
              </Section>
            )}

            <Text style={paragraph}>
              Your report contains personalized insights and recommendations
              based on the assessment data provided. We encourage you to:
            </Text>

            <Section style={listContainer}>
              <Text style={listItem}>
                • Review the findings carefully with your healthcare provider
              </Text>
              <Text style={listItem}>
                • Keep a copy for your medical records
              </Text>
              <Text style={listItem}>
                • Follow up on any recommended actions or consultations
              </Text>
              <Text style={listItem}>
                • Contact us if you have questions about the results
              </Text>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              <strong>Need Help?</strong> If you're having trouble accessing
              your report or have questions about the findings, please don't
              hesitate to contact our office.
            </Text>

            {/* Practice Information */}
            {practiceInfo && (
              <Section style={footer}>
                <Text style={footerTitle}>Contact Information</Text>
                {practiceInfo.name && (
                  <Text style={footerText}>{practiceInfo.name}</Text>
                )}
                {practiceInfo.address && (
                  <Text style={footerText}>{practiceInfo.address}</Text>
                )}
                {practiceInfo.phone && (
                  <Text style={footerText}>Phone: {practiceInfo.phone}</Text>
                )}
                {practiceInfo.website && (
                  <Text style={footerText}>
                    Website:{' '}
                    <Link href={practiceInfo.website} style={link}>
                      {practiceInfo.website}
                    </Link>
                  </Text>
                )}
              </Section>
            )}

            <Text style={disclaimer}>
              This email was sent from an automated system. Please do not reply
              to this email. If you need assistance, please contact us using the
              information provided above.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#059669',
  borderRadius: '8px 8px 0 0',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto 16px',
  maxHeight: '60px',
  maxWidth: '200px',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.3',
};

const content = {
  padding: '32px 24px',
};

const greeting = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#374151',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px',
};

const highlightBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #0ea5e9',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const highlightText = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#0c4a6e',
  margin: '0 0 8px',
};

const highlightSubtext = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#0369a1',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#059669',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  lineHeight: '1.5',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
};

const warningText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#92400e',
  margin: '0',
};

const listContainer = {
  margin: '16px 0',
  paddingLeft: '8px',
};

const listItem = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const footer = {
  marginTop: '32px',
};

const footerTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 12px',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '0 0 4px',
};

const link = {
  color: '#059669',
  textDecoration: 'underline',
};

const disclaimer = {
  fontSize: '12px',
  lineHeight: '1.4',
  color: '#9ca3af',
  marginTop: '32px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb',
};

export default ReportReadyTemplate;
