import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Img,
  Link,
  Preview,
} from '@react-email/components';

export interface BaseTemplateProps {
  previewText: string;
  headerTitle: string;
  headerColor?: string;
  children: React.ReactNode;
  practiceInfo?: {
    name?: string;
    logo?: string;
    address?: string;
    phone?: string;
    website?: string;
  };
  showFooter?: boolean;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  previewText,
  headerTitle,
  headerColor = '#2563eb',
  children,
  practiceInfo,
  showFooter = true,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: headerColor }}>
            {practiceInfo?.logo && (
              <Img
                src={practiceInfo.logo}
                alt={practiceInfo.name || 'Practice Logo'}
                style={logo}
              />
            )}
            <Heading style={headerTitleStyle}>{headerTitle}</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}

            {showFooter && (
              <>
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
                      <Text style={footerText}>
                        Phone: {practiceInfo.phone}
                      </Text>
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
                  This email was sent from an automated system. Please do not
                  reply to this email. If you need assistance, please contact us
                  using the information provided above.
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Shared styles
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
  borderRadius: '8px 8px 0 0',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto 16px',
  maxHeight: '60px',
  maxWidth: '200px',
};

const headerTitleStyle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.3',
};

const content = {
  padding: '32px 24px',
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

// Export common styles for use in other templates
export const commonStyles = {
  greeting: {
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#374151',
    margin: '0 0 16px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    margin: '0 0 16px',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
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
  },
  successButton: {
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
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    padding: '16px',
    margin: '24px 0',
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #10b981',
    borderRadius: '6px',
    padding: '16px',
    margin: '24px 0',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    textAlign: 'center' as const,
  },
};

export default BaseTemplate;
