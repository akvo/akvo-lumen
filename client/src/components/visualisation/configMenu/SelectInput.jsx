import React, { PropTypes } from 'react';
import SelectMenu from '../../common/SelectMenu';

export default function SelectInput(props) {
  return (
    <div className={`inputGroup${props.disabled ? ' disabled' : ''}`}>
      <label htmlFor={props.name}>
        {props.labelText}:
      </label>
      <SelectMenu
        name={props.name}
        disabled={props.disabled || false}
        placeholder={props.placeholder}
        value={props.choice}
        options={props.options}
        onChange={props.onChange}
        clearable={props.clearable}
        multi={props.multi}
      />
    </div>
  );
}

SelectInput.propTypes = {
  placeholder: PropTypes.string,
  labelText: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  choice: PropTypes.node,
  options: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  clearable: PropTypes.bool,
  multi: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};
