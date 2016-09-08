import React, { PropTypes } from 'react';
import SelectMenu from '../../common/SelectMenu';

export default function LabelColumnMenu(props) {
  return (
    <div className="inputGroup">
      <label htmlFor={props.name}>
        Label column:
      </label>
      <SelectMenu
        name={props.name}
        disabled={props.options ? props.options.length === 0 : true}
        placeholder="Choose a name column..."
        value={props.choice}
        onChange={props.onChange}
        options={props.options}
      />
    </div>
  );
}

LabelColumnMenu.propTypes = {
  name: PropTypes.string.isRequired,
  choice: PropTypes.string,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
