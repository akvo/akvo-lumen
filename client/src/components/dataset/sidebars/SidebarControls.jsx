import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

export default function SidebarControls({
  onClose,
  onApply,
  positiveButtonText = <FormattedMessage id="apply" />,
  negativeButtonText = <FormattedMessage id="cancel" />,
}) {
  const isDisabled = onApply == null;
  return (
    <div className="SidebarControls controls">
      <button
        className={`apply clickable ${isDisabled ? 'disabled' : ''}`}
        data-test-id="generate"
        onClick={onApply}
        disabled={isDisabled}
      >
        {positiveButtonText}
      </button>
      <button
        className="cancel clickable"
        onClick={onClose}
      >
        {negativeButtonText}
      </button>
    </div>
  );
}

SidebarControls.propTypes = {
  positiveButtonText: PropTypes.element,
  negativeButtonText: PropTypes.element,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func,
};
