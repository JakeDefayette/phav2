import React from 'react';
import { Header, type HeaderProps } from '../../organisms/Header';
import { cn } from '@/shared/utils/cn';

export interface PageLayoutProps {
  header?: HeaderProps;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  header,
  children,
  sidebar,
  footer,
  className,
  containerClassName,
}) => {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header */}
      {header && <Header {...header} />}

      {/* Main Content Area */}
      <div className={cn('flex-1', containerClassName)}>
        {sidebar ? (
          <div className='flex'>
            {/* Sidebar */}
            <aside className='w-64 bg-white border-r border-gray-200 min-h-screen'>
              <div className='p-4'>{sidebar}</div>
            </aside>

            {/* Main Content */}
            <main className='flex-1'>
              <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
                {children}
              </div>
            </main>
          </div>
        ) : (
          <main className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
            {children}
          </main>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <footer className='bg-white border-t border-gray-200'>
          <div className='max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8'>
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
};

export default PageLayout;
