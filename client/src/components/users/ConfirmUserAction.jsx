import React from 'react';
import PropTypes from 'prop-types';
import ModalWrapper from 'react-modal';
import ModalHeader from '../modals/ModalHeader';
import ModalFooter from '../modals/ModalFooter';

require('./ConfirmUserAction.scss');

function getQuestion({ email }, action) {
  let question = '';
  if (action === 'delete') {
    question = `Remove user: ${email}`;
  } else if (action === 'revoke') {
    question = `Revoke invitation sent to: ${email}`;
  } else if (action === 'demote') {
    question = `Remove admin privileges for user: ${email}`;
  } else if (action === 'promote') {
    question = `Enable admin privileges for user: ${email}`;
  }
  return `${question}?`;
}

const getButtonText = (action) => {
  switch (action) {
    case 'delete':
      return 'Remove';
    default:
      return `${action.substring(0, 1).toUpperCase()}${action.substring(1, action.length)}`;
  }
};

export default function ConfirmUserAction({ isOpen, onChange, onClose, userAction }) {
  const { action, user } = userAction;
  const question = getQuestion(user, action);
  const confirmButtonText = getButtonText(action);
  return (
    <ModalWrapper
      isOpen={isOpen}
      contentLabel="userInviteModal"
      style={{
        content: {
          width: 400,
          height: 140,
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
      <div className="ConfirmUserAction">
        <ModalHeader
          title={question}
          onCloseModal={onClose}
        />
        <ModalFooter
          leftButton={{
            text: 'Cancel',
            onClick: onClose,
          }}
          rightButton={{
            text: confirmButtonText,
            onClick: onChange,
          }}
        />
      </div>
    </ModalWrapper>
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
    }),
  }).isRequired,
};
