import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import fetch from 'isomorphic-fetch';
import CopyToClipboard from 'react-copy-to-clipboard';
import headers from '../../actions/headers';

require('../../styles/DashboardModal.scss');
require('../../styles/ShareEntity.scss');

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
      fetch('/api/shares', {
        method: 'POST',
        body: JSON.stringify({ [`${entityType}Id`]: id }),
        headers: headers(),
      })
      .then(response => response.json())
      .then(response => this.setState({ id: response.id }));
    }
  }

  render() {
    const { type, title, onClose } = this.props;
    const shareUrl = `${window.location.origin}/s/${this.state.id}`;
    return (
      <Modal
        isOpen={this.props.isOpen}
        contentLabel="shareEntityModal"
        onAfterOpen={this.fetchShareId}
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
          <div className="ShareEntity">
            <h2 className="modalTitle">{`Share ${type} "${title}"`}</h2>
            <div
              className="close clickable"
              onClick={onClose}
            >
              +
            </div>
            <div className="contents">
              <label htmlFor="shareUrlCopyButton">Share {type} {title}</label>
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
              <CopyToClipboard
                text={shareUrl}
                onCopy={() => this.setState({ copiedToClipboard: true })}
              >
                <button
                  id="shareUrlCopyButton"
                  className={`copyButton clickable ${this.state.copiedToClipboard ? 'copied' : ''}`}
                >
                  {this.state.copiedToClipboard ? 'Copied!' : 'Copy to clipboard'}
                </button>
              </CopyToClipboard>
            </div>
          </div>
        </div>
      </Modal>
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
