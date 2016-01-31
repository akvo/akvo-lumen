import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';

export default class CreateCollectionModal extends Component {
  render() {
    const { onCancel, onCreate } = this.props;
    return (
      <Modal
        isOpen={this.props.isOpen}
        style={{
          content: {
            width: 400,
            height: 200,
            marginLeft: 'auto',
            marginRight: 'auto',
          },
        }}>
        <h1>Create a new collection</h1>
        <div>Collection name</div>
        <input
          type="text"
          ref="collectionName"
          placeholder="Collection name"/>
        <div>
          <button onClick={onCancel}>
            Cancel
          </button>
          <button onClick={() => onCreate(this.refs.collectionName.value)}>
            Create
          </button>
        </div>
      </Modal>
    );
  }
}

CreateCollectionModal.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};
