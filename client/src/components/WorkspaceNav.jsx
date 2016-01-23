import React, { Component } from 'react';

import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';

export default class WorkspaceNav extends Component {
  render() {
    return (
      <nav>
        <NavLink collapsed={false}/>
        <OrganizationMenu user={this.props.user}/>
        <CollectionsList collections={this.props.collections} />
        <NavWorkspaceSwitch />
      </nav>
    );
  }
}

WorkspaceNav.propTypes = {
  collections: React.PropTypes.array,
  user: React.PropTypes.object,
};
