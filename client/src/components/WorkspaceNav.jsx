import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';
import { showModal } from '../actions/activeModal';

require('./WorkspaceNav.scss');

const hiddenLocations = ['visualisation/', 'dataset/', 'dashboard/', 'dashboard2/', 'admin/users'];

const getHiddenStatus = (pathname) => {
  let hiddenStatus = false;

  hiddenLocations.forEach((location) => {
    if (pathname.indexOf(location) > -1) {
      hiddenStatus = true;
    }
  });

  return hiddenStatus;
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

    this.handleShowCreateCollectionModal = this.handleShowCreateCollectionModal.bind(this);
    this.handleShowDeleteCollectionModal = this.handleShowDeleteCollectionModal.bind(this);
  }

  handleShowCreateCollectionModal() {
    this.props.dispatch(showModal('create-collection'));
  }

  handleShowDeleteCollectionModal(collection) {
    this.props.dispatch(showModal('delete-collection', { collection }));
  }

  render() {
    const activeSubtitle = getActiveSubtitle(this.props.location.pathname);
    const isHidden = getHiddenStatus(this.props.location.pathname);

    return (
      <nav
        className={`WorkspaceNav noSelect ${isHidden ? 'hidden' : ''}`}
      >
        <div className="header">
          <div className="rowPrimary">
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
                <FormattedMessage id="library" />
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
                className="activity subtitle notImplemented"
                isSelected={activeSubtitle === 'activity'}
              >
                <FormattedMessage id="activity" />
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
