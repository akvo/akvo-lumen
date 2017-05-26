import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import { createCollection } from '../../actions/collection';
import LoadingSpinner from '../common/LoadingSpinner';

require('./CreateCollection.scss');

const isTitleValid = (title, collections) => {
  if (!title || title.length === 0 || title.trim().length === 0) {
    return false;
  }

  const trimmedTitle = title.trim();
  const isValid = Object.keys(collections).every(key =>
    (collections[key].title !== title && collections[key].title !== trimmedTitle)
  );

  return isValid;
};

export default class CreateCollection extends Component {
  constructor() {
    super();
    this.state = {
      title: '',
      createPending: false,
      titleValid: false,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
  }

  handleInputChange(evt) {
    const newTitle = evt.target.value;
    const titleValid = isTitleValid(newTitle, this.props.collections);

    this.setState({ title: evt.target.value, titleValid });
  }

  handleCreate() {
    this.setState({
      title: '',
      titleValid: false,
      createPending: true,
    });

    const title = this.state.title.trim();
    if (title && title.length > 0) {
      this.props.onSubmit(createCollection(this.state.title, this.props.entities), Boolean('keepModal'));
    }
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
          <div className="CreateCollection">
            <h2 className="modalTitle">Create a new collection</h2>
            <div
              className="close clickable"
              onClick={() => {
                this.setState({ title: '' });
                onCancel();
              }}
            >
              ✕
            </div>
            <div className="contents">
              <label htmlFor="titleInput">Collection name</label>
              <input
                id="titleInput"
                onInput={this.handleInputChange}
                value={this.state.title}
                type="text"
                placeholder="Collection title"
                autoFocus
                maxLength={127}
              />
            </div>
            <div className="controls">
              <button
                className="cancel clickable negative"
                onClick={() => {
                  this.setState({ title: '' });
                  onCancel();
                }}
              >
                Cancel
              </button>
              <button
                className="create clickable positive"
                disabled={!this.state.titleValid}
                onClick={this.handleCreate}
              >
                <span
                  style={{
                    opacity: this.state.createPending ? 0 : 'initial',
                  }}
                >
                  Create
                </span>
                {
                  this.state.createPending &&
                    <LoadingSpinner />
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
  collections: PropTypes.object.isRequired,
  entities: PropTypes.array,
};
