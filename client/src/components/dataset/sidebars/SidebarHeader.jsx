import React from 'react';
import PropTypes from 'prop-types';

export default function SidebarHeader({ onClose, children, closeButton }) {
  return (
    <div className="SidebarHeader header">
      <h3>{children}</h3>

      <button className="close clickable" onClick={onClose}>
        {closeButton || '✖'}
      </button>
    </div>
  );
}

SidebarHeader.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  closeButton: PropTypes.any,
};
