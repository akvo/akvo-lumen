import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import { createCollection } from '../../actions/collection';
import LoadingSpinner from '../common/LoadingSpinner';


export default class CreateCollection extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      createPending: false,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }

  handleInputChange(evt) {
    this.setState({ name: evt.target.value.trim() });
  }

  handleCreate() {
    this.setState({
      name: '',
      createPending: true,
    });
    this.props.onSubmit(createCollection(this.state.name, this.props.entities), Boolean('keepModal'));
  }

  render() {
    const { onCancel } = this.props;
    return (
      <Modal
        isOpen
        contentLabel="createCollectionModal"
        style={{
          content: {
            width: 500,
            height: 300,
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: 0,
            border: '0.1rem solid rgb(223, 244, 234)',
          },
          overlay: {
            zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <div className={this.props.containerClassName}>
          <div className="CreateCollectionModal">
            <h2 className="modalTitle">Create a new collection</h2>
            <div
              className="close clickable"
              onClick={() => {
                this.setState({ name: '' });
                onCancel();
              }}
            >
              +
            </div>
            <div className="contents">
              {this.props.entities &&
                <span>Creating with {this.props.entities.length} entities</span>
              }
              <label htmlFor="nameInput">Collection name:</label>
              <input
                id="nameInput"
                onChange={this.handleInputChange}
                type="text"
                placeholder="Collection name"
              />
            </div>
            <div className="controls">
              <button
                className="cancel clickable negative"
                onClick={() => {
                  this.setState({ name: '' });
                  onCancel();
                }}
              >
                Cancel
              </button>
              <button
                className="create clickable positive"
                disabled={this.state.name === ''}
                onClick={this.handleCreate}
              >
                {
                  this.state.createPending ?
                    <LoadingSpinner />
                  :
                    <span>Create</span>
                }
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
