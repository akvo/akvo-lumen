import React, { PropTypes } from 'react';

require('../../../styles/ButtonRowInput.scss');

export default function ButtonRowInput(props) {
  const { label, options, selected, disabled } = props;
  return (
    <div className={`ButtonRowInput inputGroup${props.disabled ? ' disabled' : ''}`}>
      <h4>
        {label}
      </h4>
      <div
        className={`row ${props.buttonSpacing ? 'manualSpacing' : ''}`}
      >
        {options.map((buttonText, index) =>
          <button
            key={index}
            className={`button
              ${selected === buttonText ? 'selected' : 'unSelected'}
              ${disabled ? 'disabled' : 'clickable'}`}
            style={{
              marginRight: props.buttonSpacing ? props.buttonSpacing : 0,
            }}
            onClick={() => props.onChange(buttonText)}
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
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  buttonSpacing: PropTypes.string,
};
