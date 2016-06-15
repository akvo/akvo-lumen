import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { hideNotification } from '../actions/notification';

export function Notification({ level, message, dispatch }) {
  return (
    <div className={level}>
      {message}
      <span onClick={() => dispatch(hideNotification())}>
        x
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
