// frontend/src/components/Shared/NumberInput.tsx
import React from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label, value, min, max, step = 1, onChange, disabled = false
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      disabled={disabled}
      onChange={e => onChange(parseFloat(e.target.value))}
    />
  </div>
);

export default NumberInput;
