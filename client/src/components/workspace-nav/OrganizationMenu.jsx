import React, { Component, PropTypes } from 'react';

export default class OrganizationMenu extends Component {
  render() {
    return (
      <div>
        <div>{this.props.user.name}</div>
        <div>{this.props.user.organization}</div>
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
