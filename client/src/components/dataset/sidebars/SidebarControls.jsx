import React, { PropTypes } from 'react';

export default function SidebarControls({
  onClose,
  onApply,
  positiveButtonText = 'Apply',
  negativeButtonText = 'Cancel',
}) {
  return (
    <div className="controls">
      <button
        className="apply clickable"
        onClick={onApply}
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
  onApply: PropTypes.func.isRequired,
};
