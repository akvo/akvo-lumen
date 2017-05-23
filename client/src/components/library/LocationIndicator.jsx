import React, { PropTypes } from 'react';

export default function LocationIndicator({ location }) {
  return (
    <div className="LocationIndicator">
      <div className="contents">
        {location}
      </div>
    </div>
  );
}

LocationIndicator.propTypes = {
  location: PropTypes.string.isRequired,
};
