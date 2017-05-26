import React from 'react';
import PropTypes from 'prop-types';

require('../../../styles/ToggleInput.scss');

export default function ToggleInput(props) {
  const { checked, disabled, label, onChange } = props;
  return (
    <div
      className={`ToggleInput ${props.disabled ? ' disabled' : ''}
        ${props.className ? props.className : ''}`}
    >
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
  className: PropTypes.string,
  disabled: PropTypes.bool,
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
