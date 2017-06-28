import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { deleteCollection } from '../../actions/collection';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';

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
      <div className="DeleteCollectionModal">
        <ModalHeader
          title={`Delete collection ${collection.title}?`}
          onCloseModal={onCancel}
        />
        <div className="ModalContents" />
        <ModalFooter
          leftButton={{
            text: 'Cancel',
            className: 'cancel',
            onClick: onCancel,
          }}
          rightButton={{
            className: 'delete',
            disabled: !this.state.titleValid,
            onClick: this.handleDelete,
            text: 'Delete collection',
          }}
        />
      </div>
    );
  }
}

DeleteCollection.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  containerClassName: PropTypes.string,
  collection: PropTypes.object.isRequired,
};
