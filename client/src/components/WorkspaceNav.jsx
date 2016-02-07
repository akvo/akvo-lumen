import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';
import { showModal } from '../actions/activeModal';

require('../styles/WorkspaceNav.scss');

const collapsedLocations = ['visualisation/', 'dataset/'];

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
    this.handleShowCreateCollectionModal = this.handleShowCreateCollectionModal.bind(this);
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

  handleShowCreateCollectionModal() {
    this.props.dispatch(showModal('create-collection'));
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
          <CollectionsList
            collections={this.props.collections}
            onShowCreateCollectionModal={this.handleShowCreateCollectionModal} />
          <NavLink to="activity" />
        </div>
        <NavWorkspaceSwitch />
      </nav>
    );
  }
}

WorkspaceNav.propTypes = {
  collections: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const collections = Object.keys(state.collections).map(key => state.collections[key]);
  return {
    collections,
    user: state.user,
  };
}

export default connect(
  mapStateToProps
)(WorkspaceNav);
