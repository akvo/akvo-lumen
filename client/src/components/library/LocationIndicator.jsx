import React from 'react';
import PropTypes from 'prop-types';

export default function LocationIndicator({ location }) {
  return (
    <div className="LocationIndicator">
      <h2 className="location">
        {location}
      </h2>
    </div>
  );
}

LocationIndicator.propTypes = {
  location: PropTypes.string.isRequired,
};
