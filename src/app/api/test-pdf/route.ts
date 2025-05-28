import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/services/pdf';
import { Report } from '@/services/reports';

export async function GET() {
  try {
    // Create sample report data
    const sampleReport: Report = {
      id: 'test-report-123',
      assessment_id: 'test-assessment-456',
      report_type: 'standard',
      content: {
        child: {
          name: 'Test Child',
          age: 8,
          gender: 'Other',
        },
        assessment: {
          id: 'test-assessment-456',
          brain_o_meter_score: 75,
          completed_at: new Date().toISOString(),
          status: 'completed',
        },
        categories: {
          lifestyle: [
            {
              survey_question_definitions: {
                question_text: 'How many hours of sleep does your child get?',
              },
              response_text: '8-9 hours',
            },
            {
              survey_question_definitions: {
                question_text: 'How often does your child exercise?',
              },
              response_text: 'Daily',
            },
          ],
          nutrition: [
            {
              survey_question_definitions: {
                question_text: 'How many servings of vegetables per day?',
              },
              response_text: '3-4 servings',
            },
          ],
        },
        summary: {
          overview:
            'This is a test report to validate PDF generation functionality.',
          key_findings: [
            'Good sleep habits established',
            'Regular exercise routine',
            'Adequate vegetable intake',
          ],
        },
        recommendations: [
          'Continue current sleep schedule',
          'Maintain daily exercise routine',
          'Consider adding more variety to vegetable choices',
        ],
      },
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const practiceInfo = {
      name: 'Test Pediatric Practice',
      address: '123 Health St, Wellness City, WC 12345',
      phone: '(555) 123-4567',
      email: 'info@testpractice.com',
    };

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDFBuffer(
      sampleReport,
      practiceInfo
    );

    // Return PDF as response
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="test-report.pdf"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
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
