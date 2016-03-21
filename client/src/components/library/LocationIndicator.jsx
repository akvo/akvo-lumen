import React, { PropTypes } from 'react';

const getLocation = pathname => {
  let location;

  if (pathname === 'library') {
    location = 'Library';
  } else if (pathname.indexOf('library') > -1) {
    location = 'Collection';
  } else if (pathname.indexOf('activity') > -1) {
    location = 'Activity';
  }

  return location;
};

export default function LocationIndicator({ pathname }) {
  const location = getLocation(pathname);

  return (
    <div className="LocationIndicator">{location}</div>
  );
}

LocationIndicator.propTypes = {
  pathname: PropTypes.string.isRequired,
};
