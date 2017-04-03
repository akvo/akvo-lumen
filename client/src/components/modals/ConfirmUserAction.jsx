import React, { PropTypes } from 'react';
import Modal from 'react-modal';

require('../../styles/DashboardModal.scss');

function getQuestion(username, action) {
  const prefix = 'Are you sure you want to';
  let suffix = '';
  if (action === 'delete') {
    suffix = 'delete user';
  } else if (action === 'demote') {
    suffix = 'remove admin privileges for user';
  } else if (action === 'promote') {
    suffix = 'enable admin privileges for user';
  }
  return `${prefix} ${suffix} ${username}?`;
}

export default function ConfirmUserAction({ isOpen, onChange, onClose, user }) {
  const { action, username } = user;
  const question = getQuestion(username, action);
  return (
    <Modal
      isOpen={isOpen}
      contentLabel="confirmUserActionModal"
      style={{
        content: {
          width: 500,
          height: 200,
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
        <div className="ConfirmUserActionModal">
          <h2 className="modalTitle">Confirm User Action</h2>
          <div
            className="close clickable"
            onClick={onClose}
          >
          +
          </div>
          <div className="contents">
            <p>{question}</p>
          </div>
          <div className="controls">
            <button
              className="clickable negative"
              onClick={onClose}
            >
            Cancel
            </button>
            <button
              className="clickable positive"
              onClick={onChange}
            >
            Yes
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

ConfirmUserAction.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    action: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};
