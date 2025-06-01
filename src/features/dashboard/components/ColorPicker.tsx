'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/atoms/Button';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

// Predefined color options for practices
const PREDEFINED_COLORS = {
  primary: [
    '#2B5797', // Professional Blue
    '#4A90E2', // Sky Blue
    '#2E7D5A', // Medical Green
    '#6B73FF', // Modern Purple
    '#F39C12', // Warm Orange
    '#E74C3C', // Healthcare Red
    '#34495E', // Slate Gray
    '#1ABC9C', // Teal
  ],
  secondary: [
    '#FF8C00', // Orange
    '#32CD32', // Lime Green
    '#FFD700', // Gold
    '#FF69B4', // Hot Pink
    '#87CEEB', // Sky Blue
    '#DDA0DD', // Plum
    '#F0E68C', // Khaki
    '#98FB98', // Pale Green
  ],
};

export function ColorPicker({
  label,
  value,
  onChange,
  description,
}: ColorPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const colorType = label.toLowerCase().includes('primary')
    ? 'primary'
    : 'secondary';
  const predefinedColors = PREDEFINED_COLORS[colorType];

  const handlePredefinedColorClick = (color: string) => {
    onChange(color);
    setShowCustomInput(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const toggleCustomInput = () => {
    setShowCustomInput(!showCustomInput);
    if (!showCustomInput) {
      setCustomColor(value);
    }
  };

  return (
    <div className='space-y-3'>
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-1'>
          {label}
        </label>
        {description && (
          <p className='text-xs text-gray-500 mb-3'>{description}</p>
        )}
      </div>

      {/* Current Color Display */}
      <div className='flex items-center space-x-3 mb-4'>
        <div
          className='w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm'
          style={{ backgroundColor: value }}
        />
        <div className='text-sm'>
          <div className='font-medium text-gray-900'>Current Color</div>
          <div className='text-gray-500 font-mono text-xs'>
            {value.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Predefined Colors Grid */}
      <div>
        <div className='text-sm font-medium text-gray-700 mb-2'>
          Suggested Colors
        </div>
        <div className='grid grid-cols-4 gap-2 mb-4'>
          {predefinedColors.map(color => (
            <button
              key={color}
              type='button'
              className={`
                w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-105
                ${
                  value === color
                    ? 'border-gray-900 ring-2 ring-blue-500 ring-offset-2'
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: color }}
              onClick={() => handlePredefinedColorClick(color)}
              title={color}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Color Input */}
      <div className='border-t pt-4'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={toggleCustomInput}
          className='mb-3'
        >
          {showCustomInput ? 'Hide' : 'Use'} Custom Color
        </Button>

        {showCustomInput && (
          <div className='space-y-3'>
            <div className='flex items-center space-x-3'>
              <input
                type='color'
                value={customColor}
                onChange={handleCustomColorChange}
                className='w-12 h-10 rounded border border-gray-300 cursor-pointer'
                title='Select custom color'
              />
              <div className='flex-1'>
                <input
                  type='text'
                  value={customColor}
                  onChange={handleCustomColorChange}
                  placeholder='#FF5733'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  pattern='^#[0-9A-Fa-f]{6}$'
                />
              </div>
            </div>
            <p className='text-xs text-gray-500'>
              Enter a hex color code (e.g., #FF5733) or use the color picker
              above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
