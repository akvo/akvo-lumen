import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import { editCollection } from '../../actions/collection';


export default class ChooseCollection extends Component {
  constructor() {
    super();
    this.state = {
      collection: null;
    }
  }

  render() {
    const { onCancel, collections } = this.props;
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
          <div className="ChooseCollectionModal">
            <h2 className="modalTitle">Choose collection</h2>
            <div
              className="close clickable"
              onClick={() => {
                this.setState({ collection: null })
                onCancel();
              }}
            >
              +
            </div>
            <div className="contents">
              <label htmlFor="nameInput">Collection</label>
              <select
                onChange={(choice) => this.setState({ collection: choice })}
                placeholder="Choose collection"
              >
                {
                  collections.map((collection, index) => {
                    <option
                      key={index}
                      value={collection.id}
                    >
                      {collection.name}
                    </option>
                  })
                }
              </select>
            </div>
            <div className="controls">
              <button
                className="cancel clickable negative"
                onClick={() => {
                  this.setState({ collection: null })
                  onCancel();
                }}
              >
                Cancel
              </button>
              <button
                className="create clickable positive"
                disabled={this.state.collection === null}
                onClick={this.handleChooseCollection}
              >
                Add to collection
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
