/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { FC } from 'react';
import '@src/shared/components/toggle-button/toggle.css';
interface ToggleProps {
  label?: string;
  value: boolean;
  onChange: (checked: boolean) => void;
}
const Toggle: FC<ToggleProps> = ({ onChange, value }) => {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={value}
        onChange={e => {
          onChange(e.target.checked);
        }}
      />
      <span className="slider round"></span>
    </label>
  );
};
export default Toggle;
