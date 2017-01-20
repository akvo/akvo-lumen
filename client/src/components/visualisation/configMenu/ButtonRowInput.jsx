import React, { PropTypes } from 'react';

export default function ButtonRowInput(props) {
  const { label, options, selected, disabled } = props;
  return (
    <div className={`inputGroup${props.disabled ? ' disabled' : ''}`}>
      <h4>
        {label}
      </h4>
      <div
        name="buttonRow"
        style={{
          display: 'flex',
          flex: 1,
          justifyContent: props.buttonSpacing ? 'initial' : 'space-between',
          alignItems: 'flex-start',
        }}
      >
        {options.map((buttonText, index) =>
          <button
            key={index}
            className={`${selected === buttonText ? 'selected' : 'unSelected'} ${disabled ? 'disabled' : 'clickable'}`}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              border: '0.1rem solid whitesmoke',
              textTransform: 'capitalize',
              color: selected === buttonText ? 'white' : 'grey',
              backgroundColor: selected === buttonText ? 'grey' : 'white',
              marginRight: props.buttonSpacing ? props.buttonSpacing : '0',
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
