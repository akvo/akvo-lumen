import React, { Component, PropTypes } from 'react';

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

export default class LocationIndicator extends Component {
  render() {
    const location = getLocation(this.props.pathname);

    return (
      <div className="LocationIndicator">{location}</div>
    );
  }
}

LocationIndicator.propTypes = {
  pathname: PropTypes.string.isRequired,
};
