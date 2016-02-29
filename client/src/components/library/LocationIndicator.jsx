import React, { Component, PropTypes } from 'react';

const getLocation = pathname => {
  let location;

  if (pathname === 'library') {
    location = 'Library';
  } else if (location.indexOf('library') > -1) {
    location = 'Collection';
  } else if (location.indexOf('activity') > -1) {
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
  pathname: PropTypes.string,
};
