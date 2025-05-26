import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { AuthErrorBoundary } from '@/components/organisms/AuthErrorBoundary';
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
          <AuthProvider>{children}</AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
