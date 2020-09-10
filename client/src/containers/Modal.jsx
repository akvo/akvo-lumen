import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import ModalWrapper from 'react-modal';
import IntlWrapper from './IntlWrapper';
import CreateDataset from '../components/modals/CreateDataset';
import CreateCollection from '../components/modals/CreateCollection';
import DeleteCollection from '../components/modals/DeleteCollection';
import EditUser from '../components/modals/EditUser';
import { hideModal } from '../actions/activeModal';

require('./Modal.scss');

const getWidth = (modal) => {
  switch (modal) {
    case 'create-dataset': return 800;
    default: return 500;
  }
};

const getHeight = (modal) => {
  switch (modal) {
    case 'create-dataset': return 'auto';
    default: return 250;
  }
};

// http://reactcommunity.org/react-modal/accessibility/
ModalWrapper.setAppElement('#root');

class Modal extends Component {
  constructor() {
    super();
    this.handleOnCancel = this.handleOnCancel.bind(this);
    this.handleOnSubmit = this.handleOnSubmit.bind(this);
  }

  handleOnCancel() {
    this.props.dispatch(hideModal());
  }

  handleOnSubmit(action, keepModal) {
    this.props.dispatch(action);
    if (!keepModal) {
      this.props.dispatch(hideModal());
    }
  }

  renderActiveModal() {
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
          />
        );
      case 'create-collection':
        return (
          <CreateCollection
            onCancel={this.handleOnCancel}
            onSubmit={this.handleOnSubmit}
            entities={this.props.activeModal.entities}
            collections={this.props.collections || {}}
          />
        );
      case 'delete-collection':
        return (
          <DeleteCollection
            onCancel={this.handleOnCancel}
            onSubmit={this.handleOnSubmit}
            collection={this.props.activeModal.collection || {}}
          />
        );
      case 'edit-user':
        return (
          <EditUser
            onCancel={this.handleOnCancel}
            onSubmit={this.handleOnSubmit}
          />
        );
      default: return null;
    }
  }

  render() {
    return (
      <ModalWrapper
        isOpen={Boolean(this.props.activeModal)}
        contentLabel="createCollectionModal"
        style={{
          content: {
            width: this.props.activeModal ? getWidth(this.props.activeModal.modal) : 0,
            maxWidth: '90%',
            height: this.props.activeModal ? getHeight(this.props.activeModal.modal) : 0,
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: 0,
            border: '0.1rem solid rgb(223, 244, 234)',
            display: 'flex',
            flexDirection: 'column',
          },
          overlay: {
            zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <IntlWrapper>
          <div className="Modal">
            { this.renderActiveModal() }
          </div>
        </IntlWrapper>
      </ModalWrapper>
    );
  }
}

Modal.propTypes = {
  activeModal: PropTypes.shape({
    modal: PropTypes.string.isRequired,
    id: PropTypes.number,
    entities: PropTypes.object,
    collection: PropTypes.object,
  }),
  collections: PropTypes.object,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    activeModal: state.activeModal,
    collections: state.collections,
    translations: state.translations,
  };
}

export default connect(
  mapStateToProps
)(Modal);
