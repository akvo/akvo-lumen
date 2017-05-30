import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';
import { showModal } from '../actions/activeModal';

require('./WorkspaceNav.scss');

const collapsedLocations = ['visualisation/', 'dataset/', 'dashboard/', 'admin/users'];

const getCollapsedStatus = (pathname) => {
  let collapsedStatus = false;

  collapsedLocations.forEach((location) => {
    if (pathname.indexOf(location) > -1) {
      collapsedStatus = true;
    }
  });

  return collapsedStatus;
};

const getActiveSubtitle = (pathname) => {
  let activeSubtitle;

  if (pathname.indexOf('collections') > -1) {
    activeSubtitle = 'collections';
  } else if (pathname.indexOf('activity') > -1) {
    activeSubtitle = 'activity';
  } else if (pathname.indexOf('library') > -1) {
    activeSubtitle = 'library';
  }

  return activeSubtitle;
};

class WorkspaceNav extends Component {
  constructor() {
    super();
    this.state = {
      isManuallyInverted: false,
    };

    this.handleShowCreateCollectionModal = this.handleShowCreateCollectionModal.bind(this);
    this.handleShowDeleteCollectionModal = this.handleShowDeleteCollectionModal.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        isManuallyInverted: false,
      });
    }
  }

  getClassName(isFloatOnTop) {
    let className = 'WorkspaceNav noSelect';

    if (isFloatOnTop) {
      if (this.state.isManuallyInverted) {
        className = `${className} floating`;
      } else {
        className = `${className} collapsed`;
      }
    } else if (this.state.isManuallyInverted) {
      className = `${className} collapsed noFloat`;
    }

    return className;
  }

  handleShowCreateCollectionModal() {
    this.props.dispatch(showModal('create-collection'));
  }

  handleShowDeleteCollectionModal(collection) {
    this.props.dispatch(showModal('delete-collection', { collection }));
  }

  render() {
    const activeSubtitle = getActiveSubtitle(this.props.location.pathname);
    const isFloatOnTop = getCollapsedStatus(this.props.location.pathname);
    const className = this.getClassName(isFloatOnTop);
    const onClick = () => {
      if (this.state.isManuallyInverted) {
        this.setState({ isManuallyInverted: false });
      } else {
        this.setState({ isManuallyInverted: true });
      }
    };

    return (
      <nav
        className={className}
      >
        <div className="header">
          <div className="rowPrimary">
            <div
              className="menuIcon clickable"
              onClick={onClick}
            />
            <h1><Link to="/">Lumen</Link></h1>
          </div>
          <OrganizationMenu profile={this.props.profile} />
        </div>
        <div className="links">
          <ul>
            <li>
              <NavLink
                to="/library"
                className="library subtitle"
                isSelected={activeSubtitle === 'library'}
              >
                Library
              </NavLink>
            </li>
            <li>
              <CollectionsList
                collections={this.props.collections}
                onShowCreateCollectionModal={this.handleShowCreateCollectionModal}
                onDeleteCollection={this.handleShowDeleteCollectionModal}
                isSelected={activeSubtitle === 'collections'}
                pathname={this.props.location.pathname}
              />
            </li>
            <li>
              <NavLink
                to="/activity"
                className="activity subtitle disabled"
                isSelected={activeSubtitle === 'activity'}
              >
                Activity
              </NavLink>
            </li>
          </ul>
        </div>
        <NavWorkspaceSwitch profile={this.props.profile} />
      </nav>
    );
  }
}

WorkspaceNav.propTypes = {
  collections: PropTypes.array.isRequired,
  profile: PropTypes.object.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const collections = state.collections ?
    Object.keys(state.collections).map(key => state.collections[key]) : [];

  return {
    collections,
    profile: state.profile,
  };
}

export default connect(
  mapStateToProps
)(WorkspaceNav);
