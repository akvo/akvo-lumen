import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

export default class NavLink extends Component {
  render() {
    return (
      <Link className="NavLink" to={this.props.to}>{this.props.to}</Link>
    );
  }
}

NavLink.propTypes = {
  to: PropTypes.string,
};
