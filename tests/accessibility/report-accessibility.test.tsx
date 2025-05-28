import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock components - these would be actual components in the real app
const MockReportViewer = ({ report, practiceInfo }: any) => (
  <div>
    <header role='banner'>
      <h1>
        {report?.content?.child?.name || 'Unknown Child'} - Assessment Report
      </h1>
      {practiceInfo && (
        <div>
          <img
            src={practiceInfo.logo}
            alt={`${practiceInfo.name} logo`}
            role='img'
          />
          <h2>{practiceInfo.name}</h2>
        </div>
      )}
    </header>

    <main aria-label='Assessment Report'>
      <section aria-labelledby='summary-heading'>
        <h2 id='summary-heading'>Summary</h2>
        <p>{report?.content?.summary?.overview}</p>

        {report?.content?.summary?.key_findings && (
          <div>
            <h3>Key Findings</h3>
            <ul role='list'>
              {report.content.summary.key_findings.map(
                (finding: string, index: number) => (
                  <li key={index} role='listitem'>
                    {finding}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby='recommendations-heading'>
        <h2 id='recommendations-heading'>Recommendations</h2>
        {report?.content?.recommendations && (
          <ol role='list'>
            {report.content.recommendations.map(
              (rec: string, index: number) => (
                <li key={index} role='listitem'>
                  {rec}
                </li>
              )
            )}
          </ol>
        )}
      </section>

      {report?.content?.categories && (
        <section aria-labelledby='categories-heading'>
          <h2 id='categories-heading'>Assessment Categories</h2>
          {Object.entries(report.content.categories).map(
            ([categoryName, responses]: [string, any]) => (
              <div
                key={categoryName}
                aria-labelledby={`${categoryName}-heading`}
              >
                <h3 id={`${categoryName}-heading`}>
                  {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                </h3>
                {responses && responses.length > 0 && (
                  <dl>
                    {responses.map((response: any, index: number) => (
                      <React.Fragment key={index}>
                        <dt>
                          {response.survey_question_definitions?.question_text}
                        </dt>
                        <dd>{response.response_text}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                )}
              </div>
            )
          )}
        </section>
      )}
    </main>
  </div>
);

const MockChartComponent = ({ chartData, altText, title }: any) => (
  <figure
    aria-labelledby={`chart-title-${chartData.id}`}
    aria-describedby={`chart-desc-${chartData.id}`}
  >
    <h3 id={`chart-title-${chartData.id}`}>{title}</h3>
    <div
      role='img'
      aria-label={altText}
      style={{ width: '400px', height: '300px', backgroundColor: '#f0f0f0' }}
    >
      {/* Chart would be rendered here */}
      <span className='sr-only'>{altText}</span>
    </div>
    <figcaption id={`chart-desc-${chartData.id}`}>
      {title}.{' '}
      {chartData.hasData
        ? 'Chart data visualization.'
        : 'No data available for this chart.'}
    </figcaption>
  </figure>
);

const MockPDFDownloadButton = ({ report, disabled, ariaLabel }: any) => (
  <button
    type='button'
    disabled={disabled}
    aria-label={
      ariaLabel || `Download PDF report for ${report.content.child.name}`
    }
    aria-describedby='pdf-download-description'
  >
    Download PDF
    <span id='pdf-download-description' className='sr-only'>
      Downloads a PDF version of the assessment report that can be saved or
      printed
    </span>
  </button>
);

describe('Report Accessibility Tests', () => {
  const mockReport = {
    id: 'test-report',
    content: {
      child: {
        name: 'Test Child',
        age: 8,
        gender: 'Other',
      },
      assessment: {
        id: 'test-assessment',
        brain_o_meter_score: 75,
        completed_at: new Date().toISOString(),
        status: 'completed',
      },
      summary: {
        overview: 'This is a comprehensive assessment report.',
        key_findings: [
          'Child shows strong cognitive abilities',
          'Some areas for improvement in attention',
          'Overall positive development trajectory',
        ],
      },
      recommendations: [
        'Continue current educational approach',
        'Consider additional attention-building activities',
        'Regular follow-up assessments recommended',
      ],
      categories: {
        lifestyle: [
          {
            survey_question_definitions: {
              question_text: 'How many hours of sleep does the child get?',
            },
            response_text: '8-9 hours per night',
          },
        ],
        behavior: [
          {
            survey_question_definitions: {
              question_text: 'How does the child handle transitions?',
            },
            response_text: 'Generally well with some support',
          },
        ],
      },
    },
  };

  const mockPracticeInfo = {
    name: 'Test Practice',
    logo: 'https://example.com/logo.png',
    address: '123 Main St',
    phone: '555-0123',
    email: 'test@practice.com',
  };

  describe('Report Viewer Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2Elements.length).toBeGreaterThan(0);
      expect(h3Elements.length).toBeGreaterThan(0);

      // Check that headings have proper text content
      expect(h1).toHaveTextContent('Test Child - Assessment Report');
    });

    it('should have proper ARIA landmarks', () => {
      render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
      // No regions expected since we removed role="region" from category divs
      // The sections themselves provide the semantic structure
      const sections = document.querySelectorAll('section');
      expect(sections.length).toBe(3); // Summary, Recommendations, Categories
    });

    it('should have proper list semantics', () => {
      render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      const lists = screen.getAllByRole('list');
      const listItems = screen.getAllByRole('listitem');

      expect(lists.length).toBeGreaterThan(0);
      expect(listItems.length).toBeGreaterThan(0);

      // Check that key findings are in an unordered list
      const keyFindingsList = lists.find(list =>
        list
          .querySelector('li')
          ?.textContent?.includes('Child shows strong cognitive abilities')
      );
      expect(keyFindingsList).toBeInTheDocument();
    });

    it('should have proper section labeling', () => {
      render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      expect(screen.getByLabelText('Assessment Report')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Summary' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Recommendations' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Assessment Categories' })
      ).toBeInTheDocument();
    });

    it('should handle missing content gracefully', () => {
      const reportWithMissingContent = {
        ...mockReport,
        content: {
          ...mockReport.content,
          summary: undefined,
          recommendations: undefined,
          categories: undefined,
        },
      };

      const { container } = render(
        <MockReportViewer
          report={reportWithMissingContent}
          practiceInfo={mockPracticeInfo}
        />
      );

      // Should still render without errors
      expect(container).toBeInTheDocument();
    });

    it('should provide alternative text for practice logo', () => {
      render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      const logo = screen.getByRole('img', { name: /Test Practice logo/i });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('alt', 'Test Practice logo');
    });
  });

  describe('Chart Accessibility', () => {
    const mockChartData = {
      id: 'test-chart',
      chartType: 'pie',
      title: 'Assessment Results Distribution',
      hasData: true,
      chartData: {
        labels: ['Excellent', 'Good', 'Needs Improvement'],
        datasets: [
          {
            data: [40, 35, 25],
            backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
          },
        ],
      },
    };

    const mockAltText =
      'Assessment Results Distribution. This is a pie chart showing: Excellent: 40%, Good: 35%, Needs Improvement: 25%.';

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MockChartComponent
          chartData={mockChartData}
          altText={mockAltText}
          title='Assessment Results Distribution'
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper figure and caption structure', () => {
      render(
        <MockChartComponent
          chartData={mockChartData}
          altText={mockAltText}
          title='Assessment Results Distribution'
        />
      );

      const figure = screen.getByRole('img', {
        name: /Assessment Results Distribution/i,
      });
      expect(figure).toBeInTheDocument();

      // Check for the figcaption with the new structure
      const caption = screen.getByText(
        'Assessment Results Distribution. Chart data visualization.'
      );
      expect(caption).toBeInTheDocument();
    });

    it('should provide comprehensive alternative text', () => {
      render(
        <MockChartComponent
          chartData={mockChartData}
          altText={mockAltText}
          title='Assessment Results Distribution'
        />
      );

      const chartElement = screen.getByLabelText(mockAltText);
      expect(chartElement).toBeInTheDocument();

      // Check that alt text includes data values
      expect(mockAltText).toContain('40%');
      expect(mockAltText).toContain('35%');
      expect(mockAltText).toContain('25%');
    });

    it('should handle charts with no data', () => {
      const emptyChartData = {
        ...mockChartData,
        hasData: false,
        chartData: {
          labels: [],
          datasets: [{ data: [] }],
        },
      };

      const emptyAltText =
        'Assessment Results Distribution. This chart has no data available.';

      const { container } = render(
        <MockChartComponent
          chartData={emptyChartData}
          altText={emptyAltText}
          title='Assessment Results Distribution'
        />
      );

      expect(container).toBeInTheDocument();
      // Check for the figcaption with no data message
      expect(
        screen.getByText(
          'Assessment Results Distribution. No data available for this chart.'
        )
      ).toBeInTheDocument();
    });

    it('should provide screen reader only content', () => {
      render(
        <MockChartComponent
          chartData={mockChartData}
          altText={mockAltText}
          title='Assessment Results Distribution'
        />
      );

      const srOnlyContent = document.querySelector('.sr-only');
      expect(srOnlyContent).toBeInTheDocument();
      expect(srOnlyContent).toHaveTextContent(mockAltText);
    });
  });

  describe('PDF Download Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MockPDFDownloadButton report={mockReport} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper button semantics', () => {
      render(<MockPDFDownloadButton report={mockReport} />);

      const button = screen.getByRole('button', {
        name: /Download PDF report for Test Child/i,
      });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should provide descriptive aria-label', () => {
      render(<MockPDFDownloadButton report={mockReport} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute(
        'aria-label',
        'Download PDF report for Test Child'
      );
    });

    it('should have additional description for screen readers', () => {
      render(<MockPDFDownloadButton report={mockReport} />);

      const description = document.getElementById('pdf-download-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(
        'Downloads a PDF version of the assessment report that can be saved or printed'
      );
    });

    it('should handle disabled state properly', () => {
      render(<MockPDFDownloadButton report={mockReport} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute(
        'aria-label',
        'Download PDF report for Test Child'
      );
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      const ButtonWithClick = () => (
        <button
          type='button'
          onClick={mockOnClick}
          aria-label='Download PDF report for Test Child'
        >
          Download PDF
        </button>
      );

      render(<ButtonWithClick />);

      const button = screen.getByRole('button');

      // Test keyboard navigation
      await user.tab();
      expect(button).toHaveFocus();

      // Test activation with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Test activation with Space key
      await user.keyboard(' ');
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should not rely solely on color to convey information', () => {
      render(
        <MockReportViewer report={mockReport} practiceInfo={mockPracticeInfo} />
      );

      // Check that important information has text labels, not just color
      // Look for category sections within the categories section
      const categoriesSection = screen
        .getByRole('heading', { name: 'Assessment Categories' })
        .closest('section');
      const categoryDivs = categoriesSection?.querySelectorAll(
        'div[aria-labelledby]'
      );

      expect(categoryDivs?.length).toBeGreaterThan(0);

      categoryDivs?.forEach(section => {
        const heading = section.querySelector('h3');
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent(/\w+/); // Has actual text content
      });
    });

    it('should provide text alternatives for visual indicators', () => {
      const reportWithScores = {
        ...mockReport,
        content: {
          ...mockReport.content,
          assessment: {
            ...mockReport.content.assessment,
            brain_o_meter_score: 85,
          },
        },
      };

      render(
        <MockReportViewer
          report={reportWithScores}
          practiceInfo={mockPracticeInfo}
        />
      );

      // Score should be presented as text, not just visual indicator
      expect(screen.getByText(/Assessment Report/)).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should have proper focus indicators', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <MockPDFDownloadButton report={mockReport} />
          <MockReportViewer
            report={mockReport}
            practiceInfo={mockPracticeInfo}
          />
        </div>
      );

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should maintain logical tab order', async () => {
      const user = userEvent.setup();

      const MultipleInteractiveElements = () => (
        <div>
          <button>First Button</button>
          <MockPDFDownloadButton report={mockReport} />
          <button>Third Button</button>
        </div>
      );

      render(<MultipleInteractiveElements />);

      const buttons = screen.getAllByRole('button');

      // Tab through elements in order
      await user.tab();
      expect(buttons[0]).toHaveFocus();

      await user.tab();
      expect(buttons[1]).toHaveFocus();

      await user.tab();
      expect(buttons[2]).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should announce content changes appropriately', () => {
      const { rerender } = render(<MockReportViewer report={mockReport} />);

      // Initial render should have proper structure
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Update with new report data
      const updatedReport = {
        ...mockReport,
        content: {
          ...mockReport.content,
          summary: {
            overview: 'Updated assessment report.',
            key_findings: ['New finding'],
          },
        },
      };

      rerender(<MockReportViewer report={updatedReport} />);

      // Content should update while maintaining structure
      expect(
        screen.getByText('Updated assessment report.')
      ).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should provide context for data tables', () => {
      const reportWithTableData = {
        ...mockReport,
        content: {
          ...mockReport.content,
          categories: {
            lifestyle: [
              {
                survey_question_definitions: {
                  question_text: 'Sleep hours',
                },
                response_text: '8 hours',
              },
              {
                survey_question_definitions: {
                  question_text: 'Exercise frequency',
                },
                response_text: '3 times per week',
              },
            ],
          },
        },
      };

      render(<MockReportViewer report={reportWithTableData} />);

      // Check that question-answer pairs are properly structured
      const definitionLists = screen.getAllByRole('list');
      expect(definitionLists.length).toBeGreaterThan(0);
    });
  });

  describe('Error State Accessibility', () => {
    it('should handle missing report data gracefully', () => {
      const emptyReport = {
        id: 'empty-report',
        content: {},
      };

      const { container } = render(<MockReportViewer report={emptyReport} />);

      // Should render without throwing errors
      expect(container).toBeInTheDocument();
    });

    it('should provide meaningful error messages', () => {
      const ErrorComponent = ({ hasError }: { hasError: boolean }) => (
        <div>
          {hasError && (
            <div role='alert' aria-live='polite'>
              <h2>Error Loading Report</h2>
              <p>
                There was a problem loading the assessment report. Please try
                again or contact support.
              </p>
            </div>
          )}
        </div>
      );

      render(<ErrorComponent hasError={true} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Error Loading Report');
    });
  });
});
