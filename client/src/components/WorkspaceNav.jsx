import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import NavLink from './workspace-nav/NavLink';
import OrganizationMenu from './workspace-nav/OrganizationMenu';
import CollectionsList from './workspace-nav/CollectionsList';
import NavWorkspaceSwitch from './workspace-nav/NavWorkspaceSwitch';
import CreateCollectionModal from './workspace-nav/CreateCollectionModal';
import { createCollection } from '../actions/collection';

require('../styles/WorkspaceNav.scss');

export default class WorkspaceNav extends Component {
  constructor() {
    super();
    this.state = {
      showCreateCollectionModal: false,
    };
    this.handleCreateCollection = this.handleCreateCollection.bind(this);
    this.handleToggleCreateCollectionModal = this.handleToggleCreateCollectionModal.bind(this);
  }

  handleCreateCollection(name) {
    this.setState({ showCreateCollectionModal: false });
    this.props.dispatch(createCollection(name));
  }

  handleToggleCreateCollectionModal() {
    this.setState({ showCreateCollectionModal: !this.state.showCreateCollectionModal });
  }

  render() {
    return (
      <nav className="WorkspaceNav">
        <div className="header">
          <h1>DASH</h1>
          <OrganizationMenu user={this.props.user} />
        </div>
        <div className="links">
          <NavLink to="library" />
          <CollectionsList
            collections={this.props.collections}
            onShowCreateCollectionModal={this.handleToggleCreateCollectionModal} />
          <NavLink to="activity" />
        </div>
        <NavWorkspaceSwitch />
        <CreateCollectionModal
          isOpen={this.state.showCreateCollectionModal}
          onCreate={this.handleCreateCollection}
          onCancel={this.handleToggleCreateCollectionModal}/>
      </nav>
    );
  }
}

WorkspaceNav.propTypes = {
  collections: PropTypes.array.isRequired,
  user: PropTypes.object.isRequired,
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
