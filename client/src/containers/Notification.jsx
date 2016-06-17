import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { hideNotification } from '../actions/notification';

require('../styles/Notification.scss');

export function Notification({ level, message, dispatch }) {
  return (
    <div
      className={`Notification ${level}`}
    >
      <span
        className="message"
      >
        {message}
      </span>
      <span
        className="close clickable"
        onClick={() => dispatch(hideNotification())}
      >
        +
      </span>
    </div>
  );
}

Notification.propTypes = {
  level: PropTypes.oneOf(['info', 'warn', 'error']).isRequired,
  message: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect()(Notification);
