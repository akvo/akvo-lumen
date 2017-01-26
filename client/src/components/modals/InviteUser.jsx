import React, { PropTypes } from 'react';
import Modal from 'react-modal';

require('../../styles/DashboardModal.scss');

export default function InviteUser(props) {
  return (
    <Modal
      isOpen={props.isOpen}
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
            onClick={props.onClose}
          >
          +
          </div>
          <div className="contents">
            <p>Modal contents go here</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

InviteUser.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};
