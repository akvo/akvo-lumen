import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import ModalHeader from './ModalHeader';
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
    const { type, title, onClose } = this.props;
    const shareUrl = `${window.location.origin}/s/${this.state.id}`;
    return (
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
