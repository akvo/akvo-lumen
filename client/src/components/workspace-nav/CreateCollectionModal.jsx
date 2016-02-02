import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';

require('../../styles/CreateCollectionModal.scss');

export default class CreateCollectionModal extends Component {
  constructor() {
    super();
    this.state = { name: '' };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(evt) {
    this.setState({ name: evt.target.value.trim() });
  }

  render() {
    const { onCancel, onCreate } = this.props;
    return (
      <Modal
        isOpen={this.props.isOpen}
        style={{
          content: {
            width: 400,
            height: 250,
            marginLeft: 'auto',
            marginRight: 'auto',
          },
        }}>
        <div className="CreateCollectionModal">
          <h2 className="title">Create a new collection</h2>
          <button
            className="close clickable"
            onClick={() => {
              this.setState({ name: '' });
              onCancel();
            }}>
            X
          </button>
          <div className="contents">
            <label htmlFor="nameInput">Collection name</label>
            <input
              id="nameInput"
              onChange={this.handleInputChange}
              type="text"
              placeholder="Collection name"/>
          </div>
          <div className="controls">
            <button
              className="cancel clickable"
              onClick={() => {
                this.setState({ name: '' });
                onCancel();
              }}>
              Cancel
            </button>
            <button
              className="create clickable"
              disabled={this.state.name === ''}
              onClick={() => {
                this.setState({ name: '' });
                onCreate(this.state.name);
              }}>
              Create
            </button>
          </div>
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
