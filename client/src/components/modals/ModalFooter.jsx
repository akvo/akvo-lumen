import React from 'react';
import PropTypes from 'prop-types';

require('./ModalFooter.scss');

export default function ModalFooter({ leftButton, rightButton }) {
  return (
    <footer className="ModalFooter">
      {leftButton &&
        <button
          disabled={leftButton.disabled}
          onClick={leftButton.onClick}
          className={leftButton.className}
        >
          {leftButton.text}
        </button>
      }
      {rightButton &&
        <button
          disabled={rightButton.disabled}
          onClick={rightButton.onClick}
          className={rightButton.className}
        >
          {rightButton.text}
        </button>
      }
    </footer>
  );
}

ModalFooter.propTypes = {
  leftButton: PropTypes.object,
  rightButton: PropTypes.object,
};
