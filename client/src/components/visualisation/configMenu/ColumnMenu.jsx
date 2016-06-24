import React, { PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';

export default function ColumnMenu(props) {
  return (
    <div className="inputGroup">
      <label htmlFor={props.name}>
        Dataset column:
      </label>
      <DashSelect
        name={props.name}
        value={props.choice !== null ?
          props.choice : 'Choose a dataset column...'}
        options={props.options}
        onChange={props.onChange}
      />
    </div>
  );
}

ColumnMenu.propTypes = {
  name: PropTypes.string.isRequired,
  choice: PropTypes.string,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
