import React, { PropTypes } from 'react';

export default function SidebarControls({
  onClose,
  onApply,
  positiveButtonText = 'Apply',
  negativeButtonText = 'Cancel',
}) {
  const isDisabled = onApply == null;
  return (
    <div className="SidebarControls controls">
      <button
        className={`apply clickable ${isDisabled ? 'disabled' : ''}`}
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
  positiveButtonText: PropTypes.string,
  negativeButtonText: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func,
};
