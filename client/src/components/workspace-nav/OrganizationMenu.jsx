import React, { Component } from 'react';

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
  user: React.PropTypes.shape({
    name: React.PropTypes.string,
    organization: React.PropTypes.string,
  }),
};
