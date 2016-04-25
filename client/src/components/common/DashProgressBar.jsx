import React, { PropTypes } from 'react';

require('../../styles/DashProgressBar.scss');

export default function DashProgressBar(props) {
  return (
    <div
      className="DashProgressBar"
    >
      <div
        className="progressBar"
        role="progressbar"
        aria-valuenow={props.progressPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span className="textContent">
          Progress: { props.progressPercentage }%
        </span>
        <span
          className="progressIndicator"
          style={{
            width: `${props.progressPercentage}%`,
          }}
        />
      </div>
    </div>
  );
}

DashProgressBar.propTypes = {
  progressPercentage: PropTypes.number.isRequired,
};
