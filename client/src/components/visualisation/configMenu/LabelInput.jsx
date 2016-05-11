import React, { PropTypes } from 'react';

export default function LabelInput(props) {
  return (
    <div className="inputGroup">
      <label htmlFor={props.name}>{`${props.placeholder}:`}</label>
      <input
        className="textInput"
        name={props.name}
        type="text"
        placeholder={props.placeholder}
        defaultValue={props.value}
        onChange={props.onChange}
      />
    </div>
  );
}

LabelInput.propTypes = {
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
