import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';

require('../../styles/DashboardModal.scss');

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
    return (
      <Modal
        isOpen={isOpen}
        contentLabel="userInviteModal"
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
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <div className="DashboardModal">
          <div className="InviteUserModal">
            <h2 className="modalTitle">Invite User</h2>
            <div
              className="close clickable"
              onClick={onClose}
            >
            +
            </div>
            <div className="contents">
              <p>Please enter the email address you would like to invite below.</p>
              <input
                name="email"
                onChange={this.onChange}
                placeholder="e.g. user@domain.org"
                type="email"
                value={this.state.emailAddress}
              />
              <button onClick={this.handleInvite}>Send</button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

InviteUser.propTypes = {
  handleInvite: PropTypes.func.isRequired,
  invitedUserEmail: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onInviteUser: PropTypes.func.isRequired,
};
