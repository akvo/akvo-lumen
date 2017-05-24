import React, { PropTypes } from 'react';
import Modal from 'react-modal';

require('./DashboardModal.scss');

function getQuestion({ email, username }, action) {
  const prefix = 'Are you sure you want to';
  let suffix = '';
  if (action === 'delete') {
    suffix = `delete user ${username}`;
  } else if (action === 'revoke') {
    suffix = `revoke invitation sent to ${email}`;
  } else if (action === 'demote') {
    suffix = `remove admin privileges for user ${username}`;
  } else if (action === 'promote') {
    suffix = `enable admin privileges for user ${username}`;
  }
  return `${prefix} ${suffix}?`;
}

export default function ConfirmUserAction({ isOpen, onChange, onClose, userAction }) {
  const { action, user } = userAction;
  const question = getQuestion(user, action);
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
  userAction: PropTypes.shape({
    action: PropTypes.string.isRequired,
    user: PropTypes.shape({
      email: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
      username: PropTypes.string,
    }),
  }).isRequired,
};
