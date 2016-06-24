import React, { PropTypes } from 'react';

export default function SidebarHeader({ onClose, children }) {
  return (
    <div className="header">
      <h3>
        {children}
      </h3>
      <button
        className="close clickable"
        onClick={onClose}
      >
        X
      </button>
    </div>
  );
}

SidebarHeader.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};
