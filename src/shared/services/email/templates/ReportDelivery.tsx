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

export interface ReportDeliveryTemplateProps {
  childName: string;
  assessmentDate: string;
  downloadUrl: string;
  hasAttachment?: boolean;
  practiceInfo?: {
    name?: string;
    logo?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
}

export const ReportDeliveryTemplate: React.FC<ReportDeliveryTemplateProps> = ({
  childName,
  assessmentDate,
  downloadUrl,
  hasAttachment = false,
  practiceInfo,
}) => {
  const previewText = `Pediatric Health Assessment Report for ${childName} is ready`;

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
            <Heading style={headerTitle}>
              Pediatric Health Assessment Report
            </Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>
              Dear Parent/Guardian,
            </Text>

            <Text style={paragraph}>
              We're pleased to provide you with the completed Pediatric Health Assessment 
              report for <strong>{childName}</strong>, conducted on {assessmentDate}.
            </Text>

            {hasAttachment && (
              <Section style={attachmentNotice}>
                <Text style={attachmentText}>
                  📎 <strong>Report Attached:</strong> The complete assessment report 
                  is attached to this email as a PDF document.
                </Text>
              </Section>
            )}

            <Text style={paragraph}>
              You can also access and download your report using the secure link below:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={downloadUrl}>
                Download Report
              </Button>
            </Section>

            <Text style={paragraph}>
              This report contains valuable insights about your child's health and 
              development. Please review it carefully and don't hesitate to contact 
              us if you have any questions or concerns.
            </Text>

            <Text style={paragraph}>
              <strong>Important:</strong> This report is confidential and intended 
              only for the child's parent or legal guardian. Please keep it secure 
              and share only with authorized healthcare providers.
            </Text>

            <Hr style={divider} />

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
                    Website: <Link href={practiceInfo.website} style={link}>
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
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#2563eb',
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

const attachmentNotice = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #10b981',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
};

const attachmentText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#065f46',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
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
  color: '#2563eb',
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

export default ReportDeliveryTemplate; 