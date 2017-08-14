import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';

function LabelInput(props) {
  const placeholder = props.placeholderId ?
    props.intl.formatMessage({ id: props.placeholderId }) : props.placeholder;
  return (
    <div className="inputGroup">
      <label htmlFor={props.name}>{`${placeholder}:`}</label>
      <input
        className="textInput"
        name={props.name}
        type="text"
        placeholder={placeholder}
        value={props.value || ''}
        onChange={props.onChange}
        {... props.maxLength ? { maxLength: props.maxLength } : {}}
      />
    </div>
  );
}

LabelInput.propTypes = {
  intl: intlShape.isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  placeholderId: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number,
};

export default injectIntl(LabelInput);
