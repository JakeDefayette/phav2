'use client';

import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { CheckboxGroup } from '@/shared/components/molecules/CheckboxGroup';

const LIFESTYLE_STRESSOR_OPTIONS = [
  {
    value: 'birth-trauma',
    label: 'Birth Trauma',
    description: 'Difficult birth, C-section, or forceps delivery',
  },
  {
    value: 'digital-devices',
    label: 'Digital Devices',
    description: "Regular screen time or 'tech neck' posture",
  },
  {
    value: 'sports-physical-activity',
    label: 'Sports/Physical Activity',
    description: 'Active in sports or physical activities',
  },
  {
    value: 'emotional-stress',
    label: 'Emotional Stress',
    description: 'School pressure, family changes, anxiety',
  },
];

export default function TestCheckboxPage() {
  const [testValues, setTestValues] = useState<string[]>([]);

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4 max-w-2xl'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Checkbox Test Page
        </h1>

        {/* Test 1: Simple State */}
        <div className='bg-white p-6 rounded-lg shadow mb-8'>
          <h2 className='text-xl font-bold mb-4'>
            Test 1: Simple State (No Formik)
          </h2>
          <div className='space-y-4'>
            {LIFESTYLE_STRESSOR_OPTIONS.map(option => (
              <div key={option.value} className='flex items-center'>
                <input
                  type='checkbox'
                  id={`simple-${option.value}`}
                  checked={testValues.includes(option.value)}
                  onChange={e => {
                    if (e.target.checked) {
                      setTestValues([...testValues, option.value]);
                    } else {
                      setTestValues(testValues.filter(v => v !== option.value));
                    }
                  }}
                  className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                />
                <label
                  htmlFor={`simple-${option.value}`}
                  className='ml-3 text-sm font-medium text-gray-700'
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <div className='mt-4 p-4 bg-gray-100 rounded'>
            <strong>Selected values:</strong>{' '}
            {JSON.stringify(testValues, null, 2)}
          </div>
        </div>

        {/* Test 2: With Formik */}
        <div className='bg-white p-6 rounded-lg shadow mb-8'>
          <h2 className='text-xl font-bold mb-4'>Test 2: With Formik</h2>
          <Formik
            initialValues={{ lifestyleStressors: [] }}
            onSubmit={values => {
              console.log('Form submitted:', values);
              alert(`Selected: ${JSON.stringify(values.lifestyleStressors)}`);
            }}
          >
            {({ values }) => (
              <Form>
                <CheckboxGroup
                  name='lifestyleStressors'
                  options={LIFESTYLE_STRESSOR_OPTIONS}
                  columns={1}
                  required
                />
                <div className='mt-4 p-4 bg-gray-100 rounded'>
                  <strong>Form values:</strong>{' '}
                  {JSON.stringify(values, null, 2)}
                </div>
                <button
                  type='submit'
                  className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                >
                  Submit Test
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
