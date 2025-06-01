import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders with basic props', () => {
    render(<ProgressIndicator value={50} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays percentage when showPercentage is true', () => {
    render(<ProgressIndicator value={75} showPercentage />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<ProgressIndicator value={30} label='Upload Progress' />);

    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
  });

  it('handles edge cases correctly', () => {
    render(<ProgressIndicator value={150} max={100} showPercentage />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    const { container } = render(
      <ProgressIndicator value={50} variant='success' />
    );

    const progressFill = container.querySelector('.bg-green-500');
    expect(progressFill).toBeInTheDocument();
  });
});
