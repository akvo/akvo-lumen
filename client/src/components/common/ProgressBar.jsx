import React, { PropTypes } from 'react';

require('./ProgressBar.scss');

export default function ProgressBar(props) {
  const isErrorState = props.progressPercentage === -1;
  const progress = isErrorState ? 0 : props.progressPercentage;

  return (
    <div
      className="ProgressBar"
    >
      <div
        className={`progressBar${isErrorState ? ' error' : ''}`}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span className="textContent">
          Progress: {progress}%
        </span>
        <span
          className="progressIndicator"
          style={{
            width: `${progress}%`,
          }}
        />
        {progress === 100 && props.completionText &&
          <span className="completionText">
            {props.completionText}
          </span>
        }
        {isErrorState && props.errorText &&
          <span className="errorText">
            {props.errorText}
          </span>
        }
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  progressPercentage: PropTypes.number.isRequired,
  errorText: PropTypes.string,
  completionText: PropTypes.string,
};
