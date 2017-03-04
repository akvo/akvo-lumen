import React, { PropTypes } from 'react';
import Modal from 'react-modal';

require('../../styles/DashboardModal.scss');

export default function ConfirmUserAction(props) {
  const { action, isOpen, onClose, onConfirm } = props;
  const baseQuestion = 'Are you sure you want to ';
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
            <p>{baseQuestion}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

ConfirmUserAction.propTypes = {
  action: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
