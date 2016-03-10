import React, { Component, PropTypes } from 'react';

export default class OrganizationMenu extends Component {
  render() {
    return (
      <div className="OrganizationMenu">
        <div className="name">{this.props.user.name}</div>
        <div className="organization">{this.props.user.organization}</div>
      </div>
    );
  }
}

OrganizationMenu.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    organization: PropTypes.string,
  }),
};
