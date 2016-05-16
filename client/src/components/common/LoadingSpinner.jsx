import React from 'react';

require('../../styles/LoadingSpinner.scss');

export default function LoadingSpinner() {
  return (
    <div className="LoadingSpinner">
      <div className="uil-rolling-css">
        <div>
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
