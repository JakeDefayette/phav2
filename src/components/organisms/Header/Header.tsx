import React from 'react';
import { Button } from '../../atoms/Button';
import { cn } from '@/utils/cn';

export interface HeaderProps {
  title?: string;
  logo?: React.ReactNode;
  navigation?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  actions?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'PHA-v2',
  logo,
  navigation = [],
  actions,
  className,
}) => {
  return (
    <header className={cn('bg-white border-b border-gray-200', className)}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo and Title */}
          <div className='flex items-center space-x-4'>
            {logo && <div className='flex-shrink-0'>{logo}</div>}
            <h1 className='text-xl font-semibold text-gray-900'>{title}</h1>
          </div>

          {/* Navigation */}
          {navigation.length > 0 && (
            <nav className='hidden md:flex space-x-8'>
              {navigation.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    item.active
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className='flex items-center space-x-4'>
            {actions || (
              <Button variant='primary' size='sm'>
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
