// frontend/src/components/Shared/CheckboxInput.tsx
import React from 'react';

interface CheckboxInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({
  label, checked, onChange, disabled = false
}) => (
  <div className="mb-4 flex items-center">
    <input
      type="checkbox"
      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
      checked={checked}
      disabled={disabled}
      onChange={e => onChange(e.target.checked)}
    />
    <span className="ml-2 text-sm text-gray-700">{label}</span>
  </div>
);

export default CheckboxInput;
