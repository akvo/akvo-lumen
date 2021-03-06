import React from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';
import Select from 'react-select';

require('./SelectMenu.scss');

function SelectMenu(props) {
  let placeholder;
  if (props.placeholderId != null) {
    placeholder = props.intl.formatMessage({ id: props.placeholderId });
  } else if (props.placeholder != null) {
    placeholder = props.placeholder;
  } else {
    placeholder = `${props.intl.formatMessage({ id: 'select' })}...`;
  }

  // eslint-disable-next-line no-shadow
  const options = props.options.map(({ value, label, labelId, options }) => ({
    label: labelId ? props.intl.formatMessage({ id: labelId }) : label,
    value,
    options,
  }));

  const value = props.value && typeof props.value === 'string' ? options.filter(o => o.value === props.value)[0] : props.value;

  const width = props.width ? { width: props.width } : {};

  return (
    <div className={`SelectMenu ${props.disabled ? 'disabled' : 'enabled'}`} style={{ ...width }} >
      <Select
        {...props}
        value={value}
        options={options}
        onChange={(option) => {
          if (option) {
            props.onChange(props.multi ? option : option.value);
          } else {
            props.onChange(null);
          }
        }}
        isClearable={props.clearable || false}
        isSearchable={props.searchable || true}
        placeholder={placeholder}
        inputProps={props.inputProps}
        classNamePrefix="react-select"
      />
    </div>
  );
}

SelectMenu.propTypes = {
  intl: intlShape.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    labelId: PropTypes.string,
  })).isRequired,
  placeholder: PropTypes.string,
  placeholderId: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  isLoading: PropTypes.bool,
  multi: PropTypes.bool,
  disabled: PropTypes.bool,
  inputProps: PropTypes.object,
  width: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

export default injectIntl(SelectMenu);
