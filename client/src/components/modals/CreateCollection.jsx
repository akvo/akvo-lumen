import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import { createCollection } from '../../actions/collection';


require('../../styles/CreateCollectionModal.scss');

export default class CreateCollection extends Component {
  constructor() {
    super();
    this.state = { name: '' };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(evt) {
    this.setState({ name: evt.target.value.trim() });
  }

  render() {
    const { onCancel, onSubmit } = this.props;
    return (
      <Modal
        isOpen
        style={{
          content: {
            width: 400,
            height: 250,
            marginLeft: 'auto',
            marginRight: 'auto',
          },
          overlay: {
            zIndex: 99
          },        
        }}>
        <div className={this.props.containerClassName}>
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
                  onSubmit(createCollection(this.state.name));
                }}>
                Create
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

CreateCollection.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  containerClassName: PropTypes.string,
};
