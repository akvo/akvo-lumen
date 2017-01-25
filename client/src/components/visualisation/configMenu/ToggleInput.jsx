import React, { PropTypes } from 'react';

require('../../../styles/ToggleInput.scss');

export default function ToggleInput(props) {
  const { checked, disabled, label, onChange } = props;
  return (
    <div className={`ToggleInput inputGroup ${props.disabled ? ' disabled' : ''}`}>
      <h4 className="label">
        {label}
      </h4>
      <button
        className={`toggle clickable ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span
          className="indicator"
        />
      </button>
    </div>
  );
}

ToggleInput.propTypes = {
  disabled: PropTypes.bool,
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
