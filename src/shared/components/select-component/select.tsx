/* Copyright (C) [2024] [Scheduleon]
 This code is for viewing purposes only. Modification, redistribution, and commercial use are strictly prohibited 
 */
import { CSSProperties, FC } from 'react';
import styled from '@emotion/styled';

export interface OptionsType {
  label: string;
  value: string | number;
}

interface PageSizeSelectorProps {
  options: OptionsType[];
  defaultValue?: number | string;
  onChange: (value: string | number) => void;
  placeholder?: string;
  style?: CSSProperties;
  required?: boolean;
  hidden?: boolean;
}

const ReactSelect = styled.select`
  appearance: none;
  min-height: 40px;
  width: 70px;
  background: var(--global-bg-elevated-default);
  max-height: 40px;
  padding: 0px 16px 0px 16px;
  border: 0;
  outline: none !important;
  outline: 1px solid;
  border-radius: var(--global-radius-md);
  display: flex;
  align-items: center;
  color: var(--global-content-regular-default);
  border: var(--global-borderWidth-thin) solid var(--global-border-action-default);
  font-size: var(--component-fontSizes-button-md);
  font-weight: var(--component-fontWeights-button-default);
  font-family: var(--global-fontStack-button);
  line-height: var(--component-lineHeights-button);
  cursor: pointer;
  option {
    cursor: pointer;
  }
`;
const SelectContainer = styled.div`
  position: relative;
  .arrow-icon-container svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: var(--global-content-regular-default);
  }
  .arrow-icon-container {
    position: absolute;
    top: 9px;
    pointer-events: none;
    right: 12px;
  }
`;
const ArrowIcon = () => (
  <svg data-tag="IconChevronDown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M18.244 8.134c.423-.423.742-.634 1.06-.634.32 0 .639.212 1.062.634.423.423.634.742.634 1.061 0 .32-.211.638-.634 1.06l-3.653 3.653-3.652 3.653c-.423.423-.742.634-1.06.634-.32 0-.639-.211-1.062-.634l-3.652-3.653-3.652-3.652C3.212 9.833 3 9.514 3 9.196c0-.32.212-.638.635-1.061.423-.423.741-.635 1.06-.635.32 0 .638.212 1.06.635l2.858 2.857 2.857 2.856c.19.191.36.287.53.287.17 0 .34-.096.53-.287l2.857-2.856z"></path>
  </svg>
);
const Select: FC<PageSizeSelectorProps> = ({
  options,
  defaultValue,
  onChange,
  placeholder,
  style,
  required,
  hidden = false,
}) => {
  return (
    <SelectContainer>
      <ReactSelect
        style={style}
        value={defaultValue}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onChange={e => onChange(e.target.value)}>
        <option value="" disabled hidden={hidden} selected>
          {placeholder}
        </option>
        {options?.length ? (
          options?.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          <option>No Options</option>
        )}
      </ReactSelect>
      <div className="arrow-icon-container">
        <ArrowIcon />
      </div>
    </SelectContainer>
  );
};

export default Select;
