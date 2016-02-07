import React, { Component, PropTypes } from 'react';

import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';

require('../styles/WorkspaceNav.scss');

const collapsedLocations = ['/visualisation/'];
const getCollapsedStatus = (pathname) => {
  let collapsedStatus = false;

  collapsedLocations.map(location => {
    if (pathname.indexOf(location) > -1) {
      collapsedStatus = true;
    }
  });

  return collapsedStatus;
};

export default class WorkspaceNav extends Component {
  constructor() {
    super();
    this.state = {
      isFloating: false,
    };
  }
  getOnClick(isCollapsible) {
    let onClick = null;

    if (isCollapsible && !this.state.isFloating) {
      onClick = () => this.setState({ isFloating: true });
    }
    return onClick;
  }
  getClassName(isCollapsible) {
    let className = 'WorkspaceNav';

    if (isCollapsible) {
      if (this.state.isFloating) {
        className = `${className} floating`;
      } else {
        className = `${className} collapsed clickable`;
      }
    }

    return className;
  }
  render() {
    const isCollapsible = getCollapsedStatus(this.props.location.pathname);
    const onClick = this.getOnClick(isCollapsible);
    const className = this.getClassName(isCollapsible);

    return (
      <nav
        className={className}
        onClick={onClick}
      >
        <div className="header">
          <h1>DASH</h1>
          {isCollapsible && this.state.isFloating &&
            <button
              className="collapse clickable"
              onClick={ () => {
                this.setState({ isFloating: false });
              }}
            >
              {"<"}
            </button>
          }
          <OrganizationMenu user={this.props.user} />
        </div>
        <div className="links">
          <NavLink to="library" />
          <CollectionsList collections={this.props.collections} />
          <NavLink to="activity" />
        </div>
        <NavWorkspaceSwitch />
      </nav>
    );
  }
}

WorkspaceNav.propTypes = {
  collections: PropTypes.array,
  user: PropTypes.object,
  location: PropTypes.object,
};
