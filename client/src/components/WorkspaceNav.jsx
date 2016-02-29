import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';
import { showModal } from '../actions/activeModal';
import { Link } from 'react-router';

require('../styles/WorkspaceNav.scss');

const collapsedLocations = ['visualisation/', 'dataset/'];

const getCollapsedStatus = (pathname) => {
  let collapsedStatus = false;

  collapsedLocations.forEach(location => {
    if (pathname.indexOf(location) > -1) {
      collapsedStatus = true;
    }
  });

  return collapsedStatus;
};

const getActiveSubtitle = (pathname) => {
  let activeSubtitle;

  if (pathname === 'library') {
    activeSubtitle = 'library';
  } else if (pathname.indexOf('library') > -1) {
    activeSubtitle = 'collections';
  } else if (pathname.indexOf('activity') > -1) {
    activeSubtitle = 'activity';
  }

  return activeSubtitle;
};

export default class WorkspaceNav extends Component {
  constructor() {
    super();
    this.handleShowCreateCollectionModal = this.handleShowCreateCollectionModal.bind(this);
    this.state = {
      isManuallyExpanded: false,
      isManuallyCollapsed: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.location.pathname !== this.props.location.pathname) {
      this.setState({
        isManuallyExpanded: false,
        isManuallyCollapsed: false,
      });
    }
  }

  getOnClick(isCollapsedByDefault) {
    let onClick;

    if (isCollapsedByDefault) {
      onClick = () => {
        if (this.state.isManuallyExpanded) {
          this.setState({ isManuallyExpanded: false });
        } else {
          this.setState({ isManuallyExpanded: true });
        }
      };
    } else {
      onClick = () => {
        if (this.state.isManuallyCollapsed) {
          this.setState({ isManuallyCollapsed: false });
        } else {
          this.setState({ isManuallyCollapsed: true });
        }
      };
    }

    return onClick;
  }

  getClassName(isFloatOnTop) {
    let className = 'WorkspaceNav';

    if (isFloatOnTop) {
      if (this.state.isManuallyExpanded) {
        className = `${className} floating`;
      } else {
        className = `${className} collapsed`;
      }
    } else {
      if (this.state.isManuallyCollapsed) {
        className = `${className} collapsed noFloat`;
      }
    }

    return className;
  }

  handleShowCreateCollectionModal() {
    this.props.dispatch(showModal('create-collection'));
  }

  render() {
    const activeSubtitle = getActiveSubtitle(this.props.location.pathname);
    const isFloatOnTop = getCollapsedStatus(this.props.location.pathname);
    const onClick = this.getOnClick(isFloatOnTop);
    const className = this.getClassName(isFloatOnTop);

    return (
      <nav
        className={className}
      >
        <div className="header">
          <div className="rowPrimary">
            <div
              className="menuIcon clickable"
              onClick={onClick}
            >
            </div>
            <h1><Link to="/">DASH</Link></h1>
          </div>
          <OrganizationMenu user={this.props.user} />
        </div>
        <div className="links">
          <NavLink
            to="library"
            className="library subtitle"
            isSelected={activeSubtitle === 'library'}
          />
          <CollectionsList
            collections={this.props.collections}
            onShowCreateCollectionModal={this.handleShowCreateCollectionModal}
            isSelected={activeSubtitle === 'collections'}
            pathname={this.props.location.pathname}
          />
          <NavLink
            to="activity"
            className="activity subtitle disabled"
            isSelected={activeSubtitle === 'activity'}
          />
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
