import { NextRequest, NextResponse } from 'next/server';
import { PDFService, Report } from '@/services';

export async function GET(request: NextRequest) {
  try {
    // Create a mock report for testing
    const mockReport: Report = {
      id: 'test-report-1',
      assessment_id: 'test-assessment-1',
      practice_id: 'test-practice-1',
      report_type: 'standard',
      content: {
        summary: 'Test report summary',
        recommendations: ['Test recommendation 1', 'Test recommendation 2'],
        charts: [],
      },
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const pdfService = new PDFService();
    const pdfBuffer = await pdfService.generatePDFBuffer(mockReport);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-report.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData, practiceInfo } = body;

    const pdfService = new PDFService();

    // Validate report data
    if (!pdfService.validateReportData(reportData)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid report data provided',
        },
        { status: 400 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await pdfService.generatePDFBuffer(
      reportData,
      practiceInfo
    );

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="test-report-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
