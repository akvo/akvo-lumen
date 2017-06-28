import React from 'react';
import PropTypes from 'prop-types';

require('./ModalHeader.scss');

export default function ModalHeader({ title, onCloseModal }) {
  return (
    <header className="ModalHeader">
      <h1 className="modalTitle">{title}</h1>
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
