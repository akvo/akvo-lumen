import React, { PropTypes } from 'react';

export default function Notification({ level, message }) {
  return (
    <div className={level}>
      {message}
    </div>
  );
}

Notification.propTypes = {
  level: PropTypes.oneOf(['info', 'warn', 'error']).isRequired,
  message: PropTypes.string.isRequired,
};
