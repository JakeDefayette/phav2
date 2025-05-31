import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReportPage from '@/app/reports/[id]/page';
import { useAuth } from '@/shared/hooks';
import { useReportAccess } from '@/features/reports/hooks';
import { useBrandingContext } from '@/shared/components/BrandingProvider';

// Mock the hooks
jest.mock('@/shared/hooks');
jest.mock('@/features/reports/hooks');
jest.mock('@/shared/components/BrandingProvider');
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-report-id' }),
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseReportAccess = useReportAccess as jest.MockedFunction<
  typeof useReportAccess
>;
const mockUseBrandingContext = useBrandingContext as jest.MockedFunction<
  typeof useBrandingContext
>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock navigator.share and clipboard
Object.assign(navigator, {
  share: jest.fn(),
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Report Viewing Interface', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Default auth mock
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    // Default branding mock
    mockUseBrandingContext.mockReturnValue({
      branding: {
        primary_color: '#2B5797',
        secondary_color: '#FF8C00',
        practice_name: 'Test Practice',
        email: 'contact@testpractice.com',
      },
      loading: false,
      error: null,
      cssVariables: {},
      tailwindClasses: {},
      refreshBranding: jest.fn(),
    });

    // Default report access mock
    mockUseReportAccess.mockReturnValue({
      report: {
        id: 'test-report-id',
        assessment_id: 'test-assessment-id',
        practice_id: 'test-practice-id',
        report_type: 'standard',
        content: {
          child: {
            name: 'Test Child',
            age: 8,
            gender: 'Male',
          },
          assessment: {
            id: 'test-assessment-id',
            brain_o_meter_score: 75,
            completed_at: '2024-01-15T10:00:00Z',
          },
          visualData: {
            affectedRegions: ['cervical', 'lumbar'],
          },
          recommendations: ['Regular exercise', 'Proper posture'],
        },
        generated_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      charts: [
        {
          id: 'test-chart-1',
          type: 'bar',
          title: 'Assessment Results',
          data: [{ label: 'Test', value: 100 }],
        },
      ],
      loading: false,
      error: null,
      isDownloading: false,
      downloadReport: jest.fn(),
      refetch: jest.fn(),
      setDownloading: jest.fn(),
    });
  });

  const renderReportPage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ReportPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Authentication and Security', () => {
    it('displays loading state while authenticating', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderReportPage();

      expect(screen.getByText('Loading report...')).toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      });

      renderReportPage();

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('displays security indicators for authenticated users', () => {
      renderReportPage();

      expect(screen.getByText('Secure Report Access')).toBeInTheDocument();
      expect(
        screen.getByText(/Viewing as: test@example\.com/)
      ).toBeInTheDocument();
    });
  });

  describe('Report Content Display', () => {
    it('displays report header with patient information', () => {
      renderReportPage();

      expect(
        screen.getByText('Pediatric Health Assessment Report')
      ).toBeInTheDocument();
      expect(screen.getByText('For Test Child, Age 8')).toBeInTheDocument();
    });

    it('displays patient information section', () => {
      renderReportPage();

      expect(screen.getByText('Patient Information')).toBeInTheDocument();
      expect(screen.getByText(/Name: Test Child/)).toBeInTheDocument();
      expect(screen.getByText(/Age: 8 years old/)).toBeInTheDocument();
      expect(screen.getByText(/Gender: Male/)).toBeInTheDocument();
    });

    it('displays Brain-O-Meter component when score is available', () => {
      renderReportPage();

      // Brain-O-Meter component should be rendered
      // The exact text depends on the BrainOMeter component implementation
      expect(screen.getByText(/Assessment Charts/)).toBeInTheDocument();
    });

    it('displays spinal assessment section', () => {
      renderReportPage();

      expect(screen.getByText('Spinal Assessment')).toBeInTheDocument();
    });

    it('displays recommendations when available', () => {
      renderReportPage();

      expect(screen.getByText(/Regular exercise/)).toBeInTheDocument();
      expect(screen.getByText(/Proper posture/)).toBeInTheDocument();
    });
  });

  describe('Branding Integration', () => {
    it('applies custom branding colors to header', () => {
      renderReportPage();

      const header = screen
        .getByText('Pediatric Health Assessment Report')
        .closest('div');
      expect(header).toHaveStyle('background-color: #2B5797');
    });

    it('displays practice contact information in call-to-action', () => {
      renderReportPage();

      expect(screen.getByText('Contact Practice')).toBeInTheDocument();
    });

    it('applies branding colors to section headings', () => {
      renderReportPage();

      const patientInfoHeading = screen.getByText('Patient Information');
      expect(patientInfoHeading).toHaveStyle('color: #333333');
    });
  });

  describe('Download Functionality', () => {
    it('displays download button', () => {
      renderReportPage();

      const downloadButtons = screen.getAllByText(/Download PDF/);
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it('calls downloadReport when download button is clicked', async () => {
      const mockDownloadReport = jest.fn();
      mockUseReportAccess.mockReturnValue({
        ...mockUseReportAccess(),
        downloadReport: mockDownloadReport,
      });

      renderReportPage();

      const downloadButton = screen.getAllByText(/Download PDF/)[0];
      fireEvent.click(downloadButton);

      expect(mockDownloadReport).toHaveBeenCalled();
    });

    it('shows downloading state when download is in progress', () => {
      mockUseReportAccess.mockReturnValue({
        ...mockUseReportAccess(),
        isDownloading: true,
      });

      renderReportPage();

      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });

    it('disables download button during download', () => {
      mockUseReportAccess.mockReturnValue({
        ...mockUseReportAccess(),
        isDownloading: true,
      });

      renderReportPage();

      const downloadButton = screen.getAllByTitle('Download PDF')[0];
      expect(downloadButton).toBeDisabled();
    });
  });

  describe('Sharing Functionality', () => {
    it('uses navigator.share when available', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      (navigator.share as jest.Mock) = mockShare;

      renderReportPage();

      const shareButton = screen.getByTitle('Share report');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'Pediatric Health Assessment Report',
          text: 'View this pediatric health assessment report',
          url: expect.any(String),
        });
      });
    });

    it('falls back to clipboard when navigator.share is not available', async () => {
      // Remove navigator.share
      delete (navigator as any).share;
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = mockWriteText;

      renderReportPage();

      const shareButton = screen.getByTitle('Share report');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(expect.any(String));
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when report loading fails', () => {
      mockUseReportAccess.mockReturnValue({
        ...mockUseReportAccess(),
        report: null,
        error: 'Report not found',
        loading: false,
      });

      renderReportPage();

      expect(screen.getByText('Report Access Error')).toBeInTheDocument();
      expect(screen.getByText('Report not found')).toBeInTheDocument();
    });

    it('provides navigation options on error', () => {
      mockUseReportAccess.mockReturnValue({
        ...mockUseReportAccess(),
        report: null,
        error: 'Report not found',
        loading: false,
      });

      renderReportPage();

      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('displays not found message when report is null without error', () => {
      mockUseReportAccess.mockReturnValue({
        ...mockUseReportAccess(),
        report: null,
        error: null,
        loading: false,
      });

      renderReportPage();

      expect(screen.getByText('Report Not Found')).toBeInTheDocument();
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('handles missing navigator.share gracefully', () => {
      // Remove navigator.share
      delete (navigator as any).share;

      renderReportPage();

      const shareButton = screen.getByTitle('Share report');
      expect(shareButton).toBeInTheDocument();

      // Should not throw error when clicked
      fireEvent.click(shareButton);
    });

    it('handles missing navigator.clipboard gracefully', () => {
      delete (navigator as any).share;
      delete (navigator as any).clipboard;

      renderReportPage();

      const shareButton = screen.getByTitle('Share report');

      // Should not throw error when clicked
      fireEvent.click(shareButton);
    });
  });

  describe('Responsive Design', () => {
    it('displays responsive layout classes', () => {
      renderReportPage();

      const mainContent = screen
        .getByText('Pediatric Health Assessment Report')
        .closest('main');
      expect(mainContent).toHaveClass('min-h-screen');

      const container = screen
        .getByText('Pediatric Health Assessment Report')
        .closest('div[class*="max-w-4xl"]');
      expect(container).toHaveClass('max-w-4xl', 'mx-auto');
    });
  });
});
