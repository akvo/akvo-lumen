import React, { PropTypes } from 'react';

export default function LocationIndicator({ location }) {
  return (
    <div className="LocationIndicator">{location}</div>
  );
}

LocationIndicator.propTypes = {
  location: PropTypes.string.isRequired,
};
