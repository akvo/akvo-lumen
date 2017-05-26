import React from 'react';

require('./LoadingSpinner.scss');

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
