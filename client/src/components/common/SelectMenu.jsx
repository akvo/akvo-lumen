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

  const colorStyles = {
    menu: styles => ({
      ...styles,
      border: '1px solid #e5e6ed',
      borderTop: '0',
    }),
    option: (provided, state) => {
      let bgc = null;
      if (state.isSelected) {
        bgc = '#ccc';
      } else if (state.isFocused) {
        bgc = '#F1F3F4';
      }
      return {
        ...provided,
        backgroundColor: bgc,
      };
    },
    group: styles => ({
      ...styles,
      fontSize: '1em',
      fontWeight: 'normal',
    }),

    groupHeading: styles => ({
      ...styles,
      backgroundColor: '#E6E9ED',
      fontSize: '1em',
      padding: '10px',
      fontWeight: 'normal',
    }),
  };
  return (
    <div className={`SelectMenu ${props.disabled ? 'disabled' : 'enabled'}`}>
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
        clearable={props.isClearable || false}
        searchable={props.searchable || false}
        placeholder={placeholder}
        inputProps={props.inputProps}
        className="TheSelect"
        styles={colorStyles}
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
  isClearable: PropTypes.bool,
  searchable: PropTypes.bool,
  isLoading: PropTypes.bool,
  multi: PropTypes.bool,
  disabled: PropTypes.bool,
  inputProps: PropTypes.object,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

export default injectIntl(SelectMenu);
