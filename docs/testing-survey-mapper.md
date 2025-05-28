# Testing SurveyDataMapper Service

This guide explains how to test the `SurveyDataMapper` service that was implemented for subtask 5.2 "Survey Data Mapping".

## Overview

The `SurveyDataMapper` service transforms raw survey response data into structured formats suitable for report generation. It includes:

- Type-specific value processing (text, multiple choice, scale, boolean, number, date)
- Data validation and error handling
- Statistical analysis and insights generation
- Category grouping and completion rate calculation
- Visual data preparation for charts and tables
- Brain-O-Meter score calculation

## Testing Methods

### 1. Unit Tests (Recommended)

Run the comprehensive Jest test suite:

```bash
# Run all service tests
npm run test:services

# Run only SurveyDataMapper tests
npm test -- --testNamePattern="SurveyDataMapper"

# Run with coverage
npm run test:coverage -- --testPathPattern=tests/services
```

**What it tests:**

- ✅ Singleton pattern implementation
- ✅ All question type processing (text, multiple choice, scale, boolean, number, date)
- ✅ Data validation and error handling
- ✅ Category grouping and statistics calculation
- ✅ Visual data generation
- ✅ Data quality assessment
- ✅ Brain-O-Meter score calculation
- ✅ Insights generation
- ✅ Edge cases and error scenarios

### 2. Integration Tests

Run tests that interact with the actual database:

```bash
# Run integration tests (requires database connection)
npm test -- --testPathPattern="SurveyDataMapper.integration.test.ts" --maxWorkers=1
```

**What it tests:**

- ✅ Integration with `SurveyResponsesService`
- ✅ Real database data processing
- ✅ Mixed valid/invalid response handling
- ✅ Statistical accuracy with real data
- ✅ Performance with larger datasets
- ✅ Empty assessment handling

**Prerequisites:**

- Supabase test database configured
- Environment variables set in `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-test-database-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
  ```

### 3. Manual Testing Script

Run the interactive test script for quick verification:

```bash
# Install tsx if not already installed
npm install

# Run the manual test script
npm run test:survey-mapper
```

**What it tests:**

- 📊 Basic mapping with diverse question types
- 🔧 Error handling with invalid responses
- 📭 Empty data handling
- 💡 Insights generation
- ⚡ Performance with large datasets (100 responses)

**Sample Output:**

```
🧪 Testing SurveyDataMapper Service...

📊 Test 1: Basic mapping with diverse question types
✅ Mapping successful!
   Total Questions: 8
   Answered Questions: 8
   Completion Rate: 100.0%
   Categories: emotional, cognitive, social, physical, general
   Data Quality: excellent
   Brain-O-Meter Score: 82.5

🔧 Test 2: Error handling with invalid responses
✅ Error handling successful!
   Total Questions: 7
   Valid Responses: 2
   Invalid Responses: 5
   Validation Errors: 5
   Data Quality: poor

...
```

## Test Coverage

The test suite covers:

### Core Functionality

- [x] Data mapping from survey responses to structured format
- [x] Question type processing for all supported types
- [x] Category grouping and organization
- [x] Statistical calculations (averages, totals, percentages)
- [x] Completion rate calculations

### Data Validation

- [x] Required field validation
- [x] Type-specific validation (ranges, lengths, formats)
- [x] Invalid data handling and fallback responses
- [x] Error collection and reporting

### Advanced Features

- [x] Brain-O-Meter score calculation
- [x] Insights generation based on response patterns
- [x] Visual data preparation for charts and tables
- [x] Data quality assessment

### Edge Cases

- [x] Empty response arrays
- [x] Missing question definitions
- [x] Malformed response data
- [x] Out-of-range values
- [x] Invalid date formats
- [x] Unsupported question types

### Performance

- [x] Large dataset processing (100+ responses)
- [x] Processing time benchmarks
- [x] Memory usage optimization

## Expected Results

### Valid Data Processing

When processing valid survey data, expect:

- ✅ All responses marked as valid (`isValid: true`)
- ✅ Proper type conversion (strings to numbers, etc.)
- ✅ Accurate statistical calculations
- ✅ Data quality rated as "excellent" or "good"
- ✅ Brain-O-Meter score between 0-100
- ✅ Generated insights array with meaningful content

### Invalid Data Handling

When processing invalid data, expect:

- ⚠️ Invalid responses marked with `isValid: false`
- ⚠️ Validation errors collected in metadata
- ⚠️ Fallback responses created for failed processing
- ⚠️ Data quality rated as "fair" or "poor"
- ✅ Processing continues despite individual failures

### Performance Benchmarks

- ✅ 100 responses processed in < 5 seconds
- ✅ Memory usage remains stable
- ✅ No memory leaks during repeated processing

## Troubleshooting

### Common Issues

**1. Test Database Connection Errors**

```
Error: Missing required environment variables
```

**Solution:** Ensure `.env.local` contains valid Supabase test database credentials.

**2. Type Errors in Tests**

```
Type 'unknown' is not assignable to type 'QuestionType'
```

**Solution:** Ensure database types are up to date. Run `npm run type-check`.

**3. Performance Test Failures**

```
Processing time exceeded 5000ms
```

**Solution:** This may indicate performance issues. Check system resources or reduce test dataset size.

### Debugging Tips

1. **Enable Verbose Logging:**

   ```typescript
   // In test files, add console.log statements
   console.log('Mapped data:', JSON.stringify(result, null, 2));
   ```

2. **Check Validation Errors:**

   ```typescript
   if (result.metadata.validationErrors.length > 0) {
     console.log('Validation errors:', result.metadata.validationErrors);
   }
   ```

3. **Inspect Individual Responses:**
   ```typescript
   result.rawResponses.forEach((response, index) => {
     if (!response.isValid) {
       console.log(`Invalid response ${index}:`, response.validationErrors);
     }
   });
   ```

## Integration with Report Generation

The `SurveyDataMapper` service is designed to integrate with the report generation system:

```typescript
import { SurveyDataMapper } from '@/services/SurveyDataMapper';
import { SurveyResponsesService } from '@/services/surveyResponses';

// Example usage in report generation
const mapper = SurveyDataMapper.getInstance();
const surveyService = new SurveyResponsesService();

const responses = await surveyService.getResponsesWithQuestions(assessmentId);
const mappedData = await mapper.mapSurveyData(responses, assessmentId);

// Use mappedData for PDF generation, charts, etc.
```

## Next Steps

After verifying the `SurveyDataMapper` service works correctly:

1. **Proceed to Subtask 5.3:** Chart and Diagram Rendering
2. **Integrate with PDF Generation:** Use mapped data in report templates
3. **Add Custom Validation Rules:** Extend validation for specific question types
4. **Performance Optimization:** Optimize for larger datasets if needed

## Files Created/Modified

- `src/services/SurveyDataMapper.ts` - Main service implementation
- `tests/services/SurveyDataMapper.test.ts` - Unit tests
- `tests/services/SurveyDataMapper.integration.test.ts` - Integration tests
- `scripts/test-survey-mapper.ts` - Manual testing script
- `package.json` - Added test scripts and tsx dependency

The service is now ready for production use and integration with the report generation system!
