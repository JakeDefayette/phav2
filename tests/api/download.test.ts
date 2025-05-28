// @ts-nocheck

import { NextRequest } from 'next/server';
import { GET } from '../../src/app/reports/download/[token]/route';

// Mock the dependencies
jest.mock('../../src/lib/supabase-server');
jest.mock('../../src/services/pdf');

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({ error: null })),
  })),
};

const mockPDFService = {
  generateReportPDF: jest
    .fn()
    .mockResolvedValue(Buffer.from('mock-pdf-content')),
};

jest.mock('../../src/lib/supabase-server', () => ({
  supabaseServer: mockSupabase,
}));

jest.mock('../../src/services/pdf', () => ({
  PDFService: jest.fn().mockImplementation(() => mockPDFService),
}));

describe('/api/reports/download/[token]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully download PDF with valid token', async () => {
    // Mock valid report data
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: {
          id: 'test-report-id',
          child_name: 'Test Child',
          assessment_date: '2024-01-15',
          share_token: 'valid-token',
          share_expires_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours from now
          user_id: 'test-user-id',
        },
        error: null,
      });

    const request = new NextRequest(
      'http://localhost:3000/reports/download/valid-token'
    );
    const response = await GET(request, { params: { token: 'valid-token' } });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'pediatric-assessment-Test Child-2024-01-15.pdf'
    );
    expect(mockPDFService.generateReportPDF).toHaveBeenCalledWith(
      'test-report-id'
    );

    // Verify security logging was called
    expect(mockSupabase.from).toHaveBeenCalledWith('report_access_logs');
  });

  it('should return 404 for invalid token', async () => {
    // Mock no report found
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

    const request = new NextRequest(
      'http://localhost:3000/reports/download/invalid-token'
    );
    const response = await GET(request, { params: { token: 'invalid-token' } });

    expect(response.status).toBe(404);

    const responseData = await response.json();
    expect(responseData.error).toBe('Report not found or access denied');
  });

  it('should return 410 for expired token', async () => {
    // Mock expired report
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: {
          id: 'test-report-id',
          child_name: 'Test Child',
          assessment_date: '2024-01-15',
          share_token: 'expired-token',
          share_expires_at: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString(), // 24 hours ago
          user_id: 'test-user-id',
        },
        error: null,
      });

    const request = new NextRequest(
      'http://localhost:3000/reports/download/expired-token'
    );
    const response = await GET(request, { params: { token: 'expired-token' } });

    expect(response.status).toBe(410);

    const responseData = await response.json();
    expect(responseData.error).toBe('Download link has expired');
  });

  it('should handle PDF generation errors', async () => {
    // Mock valid report data
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: {
          id: 'test-report-id',
          child_name: 'Test Child',
          assessment_date: '2024-01-15',
          share_token: 'valid-token',
          share_expires_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          user_id: 'test-user-id',
        },
        error: null,
      });

    // Mock PDF generation failure
    mockPDFService.generateReportPDF.mockRejectedValueOnce(
      new Error('PDF generation failed')
    );

    const request = new NextRequest(
      'http://localhost:3000/reports/download/valid-token'
    );
    const response = await GET(request, { params: { token: 'valid-token' } });

    expect(response.status).toBe(500);

    const responseData = await response.json();
    expect(responseData.error).toBe('Failed to generate PDF');
  });

  it('should log security information for all requests', async () => {
    // Mock valid report data
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: {
          id: 'test-report-id',
          child_name: 'Test Child',
          assessment_date: '2024-01-15',
          share_token: 'valid-token',
          share_expires_at: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          user_id: 'test-user-id',
        },
        error: null,
      });

    const request = new NextRequest(
      'http://localhost:3000/reports/download/valid-token',
      {
        headers: {
          'user-agent': 'Test Browser',
          'x-forwarded-for': '192.168.1.1',
        },
      }
    );

    await GET(request, { params: { token: 'valid-token' } });

    // Verify security logging includes IP and user agent
    expect(mockSupabase.from).toHaveBeenCalledWith('report_access_logs');
    expect(mockSupabase.from().insert).toHaveBeenCalledWith({
      report_id: 'test-report-id',
      share_token: 'valid-token',
      ip_address: '192.168.1.1',
      user_agent: 'Test Browser',
      access_time: expect.any(String),
      success: true,
    });
  });
});
