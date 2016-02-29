import React, { Component } from 'react';

const getLocation = pathname => {
  let location;

  if (pathname === 'library') {
    location = 'Library';
  } else if (location.indexOf('library') > -1) {
    pathname = 'Collection';
  } else if (location.indexOf('activity') > -1) {
    pathname = 'Activity';
  }
  return location;
}

export default class LocationIndicator extends Component {
  render() {
    const location = getLocation(this.props.pathname);

    return (
      <div className="LocationIndicator">{location}</div>
    );
  }
}
