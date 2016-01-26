import React, { Component, PropTypes } from 'react';

export default class NavLink extends Component {
  render() {
    return (
      <div className="NavLink">{this.props.to}</div>
    );
  }
}

NavLink.propTypes = {
  to: PropTypes.string,
};
