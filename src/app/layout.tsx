import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/shared/hooks';
import { AuthErrorBoundary } from '@/shared/components/organisms/AuthErrorBoundary';
import { ToastProvider } from '@/shared/components/molecules/Toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chiropractic Practice Growth Platform',
  description:
    'A comprehensive platform for chiropractic practice management and patient care',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthErrorBoundary>
          <AuthProvider>
            <ToastProvider position='top-right' maxToasts={5}>
              {children}
            </ToastProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
