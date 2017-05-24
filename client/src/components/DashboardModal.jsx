import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import CreateDataset from './modals/CreateDataset';
import CreateCollection from './modals/CreateCollection';
import DatasetSettings from './modals/DatasetSettings';
import { hideModal } from '../actions/activeModal';

require('./modals/DashboardModal.scss');

class DashboardModal extends Component {

  constructor() {
    super();
    this.handleOnCancel = this.handleOnCancel.bind(this);
    this.handleOnSubmit = this.handleOnSubmit.bind(this);
  }

  handleOnCancel() {
    this.props.dispatch(hideModal());
  }

  handleOnSubmit(action) {
    this.props.dispatch(action);
    this.props.dispatch(hideModal());
  }

  renderActiveModal() {
    const containerClassName = 'DashboardModal';

    if (!this.props.activeModal) {
      // No modal active
      return null;
    }
    switch (this.props.activeModal.modal) {
      case 'create-dataset':
        return (
          <CreateDataset
            onCancel={this.handleOnCancel}
            onSubmit={this.handleOnSubmit}
            containerClassName={containerClassName}
          />
        );
      case 'create-collection':
        return (
          <CreateCollection
            onCancel={this.handleOnCancel}
            onSubmit={this.handleOnSubmit}
            containerClassName={containerClassName}
          />
        );
      case 'dataset-settings':
        return (
          <DatasetSettings
            onCancel={this.handleOnCancel}
            onSubmit={this.handleOnSubmit}
            id={this.props.activeModal.id}
            containerClassName={containerClassName}
          />
        );
      default: return null;
    }
  }

  render() {
    return this.renderActiveModal();
  }
}

DashboardModal.propTypes = {
  activeModal: PropTypes.shape({
    modal: PropTypes.string.isRequired,
    id: PropTypes.number,
  }),
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    activeModal: state.activeModal,
  };
}

export default connect(
  mapStateToProps
)(DashboardModal);
