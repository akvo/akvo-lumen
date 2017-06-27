import React from 'react';
import PropTypes from 'prop-types';

require('./ModalHeader.scss');

export default function ModalHeader({ title, onCloseModal }) {
  return (
    <header className="ModalHeader">
      <h2 className="modalTitle">{title}</h2>
      <button
        className="close clickable"
        onClick={onCloseModal}
      >
        ✕
      </button>
    </header>
  );
}

ModalHeader.propTypes = {
  onCloseModal: PropTypes.func.isRequired,
  title: PropTypes.string,
};
