import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import ModalWrapper from 'react-modal';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import * as api from '../../api';

require('./ShareEntity.scss');

export default class ShareEntity extends Component {

  constructor() {
    super();
    this.state = {
      id: '',
      copiedToClipboard: false,
    };
    this.fetchShareId = this.fetchShareId.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isOpen) {
      this.setState({ copiedToClipboard: false });
    }
  }

  fetchShareId() {
    const { id } = this.props;
    const entityType = this.props.type;

    if (id != null) {
      api.post('/api/shares', { [`${entityType}Id`]: id })
        .then(response => response.json())
        .then(response => this.setState({ id: response.id }));
    }
  }

  render() {
    const { type, title, onClose, isOpen } = this.props;
    const shareUrl = `${window.location.origin}/s/${this.state.id}`;
    const copyButton = (
      <CopyToClipboard
        text={shareUrl}
        onCopy={() => this.setState({ copiedToClipboard: true })}
      >
        <span
          id="shareUrlCopyButton"
          className={`copyButton ${this.state.copiedToClipboard ? 'copied' : ''}`}
        >
          {this.state.copiedToClipboard ? 'Copied!' : 'Copy to clipboard'}
        </span>
      </CopyToClipboard>
    );

    return (
      <ModalWrapper
        isOpen={isOpen}
        onAfterOpen={this.fetchShareId}
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
        <div className="ShareEntity">
          <ModalHeader
            title={`Share ${type}: ${title}`}
            onCloseModal={onClose}
          />
          <div className="ModalContents">
            <label htmlFor="shareUrlCopyButton">URL for {type}: {title}</label>
            <div
              className="shareUrl"
            >
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {shareUrl}
              </a>
            </div>
          </div>
          <ModalFooter
            leftButton={{
              text: 'Close',
              onClick: onClose,
            }}
            rightButton={{
              text: copyButton,
            }}
          />
        </div>
      </ModalWrapper>
    );
  }
}

ShareEntity.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  id: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
};
