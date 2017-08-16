import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

require('./ToggleInput.scss');

export default function ToggleInput(props) {
  const { checked, disabled, label, labelId, onChange } = props;
  let labelValue;
  if (label !== undefined) {
    labelValue = label;
  } else if (labelId !== undefined) {
    labelValue = <FormattedMessage id={labelId} />;
  } else {
    labelValue = '';
  }

  return (
    <div
      className={`ToggleInput ${props.disabled ? ' disabled' : ''}
        ${props.className ? props.className : ''}`}
    >
      <h4 className="label">
        { labelValue }
      </h4>
      <button
        className={`toggle clickable ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span
          className="indicator"
        />
      </button>
    </div>
  );
}

ToggleInput.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  checked: PropTypes.bool.isRequired,
  label: PropTypes.string,
  labelId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
