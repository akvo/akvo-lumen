import React from 'react';
import PropTypes from 'prop-types';

require('./ButtonRowInput.scss');

export default function ButtonRowInput(props) {
  const { label, options, selected, disabled } = props;
  return (
    <div className={`ButtonRowInput inputGroup${props.disabled ? ' disabled' : ''}`}>
      {label && (
        <h4>
          {label}
        </h4>
      )}
      <div
        className={`row ${props.buttonSpacing ? 'manualSpacing' : ''}`}
      >
        {options.map(({ value, label: buttonText }, index) =>
          <button
            key={index}
            className={`button
              ${selected === value ? 'selected' : 'unSelected'}
              ${disabled ? 'disabled' : 'clickable'}`}
            style={{
              marginRight: props.buttonSpacing ? props.buttonSpacing : 0,
            }}
            onClick={() => props.onChange(value)}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

ButtonRowInput.propTypes = {
  disabled: PropTypes.bool,
  options: PropTypes.array.isRequired,
  selected: PropTypes.node.isRequired,
  label: PropTypes.node,
  onChange: PropTypes.func.isRequired,
  buttonSpacing: PropTypes.string,
};
