import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ModalWrapper from 'react-modal';
import isValidEmail from '../../utils';
import ModalHeader from '../modals/ModalHeader';
import ModalFooter from '../modals/ModalFooter';

require('./InviteUser.scss');

export default class InviteUser extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '' };
    this.onChange = this.onChange.bind(this);
    this.handleInvite = this.handleInvite.bind(this);
  }

  onChange(event) {
    const email = event.target.value.trim().toLowerCase();
    this.setState({ email });
  }

  handleInvite() {
    this.props.onInviteUser(this.state.email);
    this.setState({ email: '' });
  }

  render() {
    const { isOpen, onClose } = this.props;
    const isDisabled = !isValidEmail(this.state.email);
    return (
      <ModalWrapper
        isOpen={isOpen}
        contentLabel="userInviteModal"
        style={{
          content: {
            width: 500,
            height: 180,
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: 0,
            border: '0.1rem solid rgb(223, 244, 234)',
            display: 'flex',
          },
          overlay: {
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <div className="InviteUser">
          <ModalHeader
            title="Invite user"
            onCloseModal={onClose}
          />
          <div className="ModalContents">
            <p>Please enter the email address you would like to invite.</p>
            <input
              className="emailInput"
              name="email"
              onChange={this.onChange}
              placeholder="Enter email address"
              type="email"
              value={this.state.email}
            />
          </div>
          <ModalFooter
            leftButton={{
              text: 'Cancel',
              onClick: this.props.onClose,
            }}
            rightButton={{
              text: 'Invite user',
              disabled: isDisabled,
              onClick: this.handleInvite,
            }}
          />
        </div>
      </ModalWrapper>
    );
  }
}

InviteUser.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInviteUser: PropTypes.func.isRequired,
};
