import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

export default class NavLink extends Component {
  render() {
    let className = 'NavLink';
    if (this.props.className) className += ` ${this.props.className}`;
    if (this.props.isSelected) className += ' selected';

    return (
      <Link
        className={className}
        to={this.props.to}>{this.props.to}
      </Link>
    );
  }
}

NavLink.propTypes = {
  to: PropTypes.string,
};
