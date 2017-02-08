import React, { PropTypes } from 'react';
import Modal from 'react-modal';

require('../../styles/DashboardModal.scss');

export default function InviteUser(props) {
  const { invitedUserEmail, isOpen, onChange, onClose, onInviteUser } = props;

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
            <form onSubmit={onInviteUser}>
              <input
                onChange={onChange}
                placeholder="e.g. user@domain.org"
                type="email"
                value={invitedUserEmail}
              />
              <input type="submit" value="Send" />
            </form>
          </div>
        </div>
      </div>
    </Modal>
  );
}

InviteUser.propTypes = {
  invitedUserEmail: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onInviteUser: PropTypes.func.isRequired,
};
