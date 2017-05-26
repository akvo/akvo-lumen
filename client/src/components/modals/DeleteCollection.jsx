import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import { deleteCollection } from '../../actions/collection';


export default class DeleteCollection extends Component {
  constructor() {
    super();
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleDelete() {
    this.props.onSubmit(deleteCollection(this.props.collection.id));
  }

  render() {
    const { collection, onCancel } = this.props;
    return (
      <Modal
        isOpen
        contentLabel="deleteCollectionModal"
        style={{
          content: {
            width: 500,
            height: 150,
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
          <div className="DeleteCollectionModal">
            <h2 className="modalTitle">{`Delete ${collection.title}`}</h2>
            <div
              className="close clickable"
              onClick={() => {
                onCancel();
              }}
            >
              +
            </div>
            <div className="contents" />
            <div className="controls">
              <button
                className="cancel clickable negative"
                onClick={() => {
                  onCancel();
                }}
              >
                Cancel
              </button>
              <button
                className="create clickable positive dangerous"
                onClick={this.handleDelete}
              >
                <span>Delete collection</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

DeleteCollection.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  containerClassName: PropTypes.string,
  collection: PropTypes.object.isRequired,
};
