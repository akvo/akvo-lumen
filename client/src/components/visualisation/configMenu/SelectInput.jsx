import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';

require('./SelectInput.scss');

function SelectInput(props) {
  return (
    <div className={`inputGroup${props.disabled ? ' disabled' : ''}`}>
      <label htmlFor={props.name} data-test-id={props.name}>
        {props.labelTextId ? <FormattedMessage id={props.labelTextId} /> : props.labelText}:
      </label>
      <SelectMenu
        name={props.name}
        disabled={props.disabled || false}
        placeholder={props.placeholder}
        placeholderId={props.placeholderId}
        value={props.choice}
        options={props.options}
        onChange={props.onChange}
        clearable={props.clearable}
        multi={props.multi}
        inputProps={props.inputProps}
      />
    </div>
  );
}

SelectInput.propTypes = {
  intl: intlShape.isRequired,
  placeholder: PropTypes.string,
  placeholderId: PropTypes.string,
  labelText: PropTypes.string,
  labelTextId: PropTypes.string,
  name: PropTypes.string.isRequired,
  choice: PropTypes.node,
  options: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  clearable: PropTypes.bool,
  multi: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  inputProps: PropTypes.object,
};

export default injectIntl(SelectInput);
