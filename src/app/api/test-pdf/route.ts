import { NextRequest, NextResponse } from 'next/server';
import { PDFService } from '@/features/reports/services/pdf';
import { GeneratedReport } from '@/features/reports/types';

export async function GET(request: NextRequest) {
  try {
    // Create a mock report for testing
    const mockReport: GeneratedReport = {
      id: 'test-report-1',
      assessment_id: 'test-assessment-1',
      practice_id: 'test-practice-1',
      report_type: 'standard',
      content: {
        child: {
          name: 'Test Child',
          age: 8,
        },
        assessment: {
          id: 'test-assessment-1',
          brain_o_meter_score: 75,
          completed_at: new Date().toISOString(),
        },
        summary: {
          overview: 'Test report summary',
          key_findings: ['Test finding 1', 'Test finding 2'],
        },
        insights: ['Test insight 1', 'Test insight 2'],
        recommendations: ['Test recommendation 1', 'Test recommendation 2'],
      },
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const pdfService = PDFService.getInstance();
    const pdfBuffer = await pdfService.generatePDFBuffer(mockReport);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-report.pdf"',
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
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

    const pdfService = PDFService.getInstance();

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
