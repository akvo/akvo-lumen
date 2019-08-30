import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { editUser } from '../../actions/user';
import ModalFooter from './ModalFooter';

class EditUser extends Component {
  constructor() {
    super();
    this.handleEdit = this.handleEdit.bind(this);
  }

  handleEdit() {
    const user = { firstName: 'Kalle', lastName: 'Sunnerek' };
    this.props.onSubmit(editUser(user));
  }

  render() {
    const { onCancel } = this.props;
    return (
      <div className="EditUser">
        <h2>EditUser</h2>
        <ModalFooter
          leftButton={{
            text: 'Cancel',
            className: 'cancel',
            onClick: onCancel,
          }}
          rightButton={{
            className: 'save',
            onClick: this.handleEdit,
            text: 'Save',
          }}
        />
      </div>
    );
  }
}

EditUser.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default injectIntl(EditUser);
