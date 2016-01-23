import React, { Component, PropTypes } from 'react';

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
  collections: PropTypes.array,
  user: PropTypes.object,
};
