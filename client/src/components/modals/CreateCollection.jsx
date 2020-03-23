import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { createCollection } from '../../actions/collection';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';

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

class CreateCollection extends Component {
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
    const { onCancel, intl } = this.props;
    return (
      <div className="CreateCollection">
        <ModalHeader
          title={<FormattedMessage id="new_collection" />}
          onCloseModal={onCancel}
        />
        <div className="ModalContents">
          <label htmlFor="titleInput">
            <FormattedMessage id="collection_name" />
          </label>
          <input
            id="titleInput"
            onChange={this.handleInputChange}
            value={this.state.title}
            type="text"
            placeholder={intl.formatMessage({ id: 'untitled_collection' })}
            autoFocus
            maxLength={127}
          />
        </div>
        <ModalFooter
          leftButton={{
            text: <FormattedMessage id="cancel" />,
            className: 'cancel',
            onClick: () => {
              this.setState({ title: '' });
              onCancel();
            },
          }}
          rightButton={{
            className: 'create',
            disabled: !this.state.titleValid,
            onClick: this.handleCreate,
            text: <FormattedMessage id={this.state.createPending ? 'creating' : 'create'} />,
          }}
        />
      </div>
    );
  }
}

CreateCollection.propTypes = {
  intl: intlShape,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  containerClassName: PropTypes.string,
  collections: PropTypes.object.isRequired,
  entities: PropTypes.object,
};

export default injectIntl(CreateCollection);
