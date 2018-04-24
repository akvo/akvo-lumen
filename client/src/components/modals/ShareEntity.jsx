import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import ModalWrapper from 'react-modal';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import ToggleInput from '../common/ToggleInput';
import * as api from '../../api';

require('./ShareEntity.scss');

export default class ShareEntity extends Component {

  constructor() {
    super();
    this.state = {
      id: '',
      copiedToClipboard: null,
      showEmbed: false,
    };
    this.fetchShareId = this.fetchShareId.bind(this);
    this.handleSavePassword = this.handleSavePassword.bind(this);
    this.handleChangePassword = this.handleChangePassword.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.isOpen) {
      this.setState({ copiedToClipboard: null, showEmbed: false });
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

  handleChangePassword(event) {
    this.setState({ password: event.target.value });
  }

  handleSavePassword() {
    this.props.onSetPassword(this.state.password);
  }

  render() {
    const { type, title, onClose, isOpen, canSetPrivacy } = this.props;
    const shareUrl = `${window.location.origin}/s/${this.state.id}`;
    const defaultHeight = type === 'visualisation' ? '500px' : '1000px';
    const embedCode = `<iframe width="100%" height="${defaultHeight}" src="${shareUrl}" frameborder="0" allow="encrypted-media"></iframe>`;

    return (
      <ModalWrapper
        isOpen={isOpen}
        onAfterOpen={this.fetchShareId}
        contentLabel="userInviteModal"
        style={{
          content: {
            width: 500,
            height: 320,
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

            {canSetPrivacy && (
              <div className="row">
                <div className="rowContainer">
                  <ToggleInput
                    checked={this.state.showPassword}
                    label="Password protected"
                    onChange={() => {
                      this.setState({ showPassword: !this.state.showPassword });
                    }}
                  />
                </div>
              </div>
            )}

            {(canSetPrivacy && this.state.showPassword) && (
              <div className="row">
                <div className="rowContainer privacyContainer">
                  <input
                    placeholder="Password"
                    type="password"
                    onChange={this.handleChangePassword}
                  />
                  <button
                    onClick={this.handleSavePassword}
                    className="savePasswordButton"
                    data-test-id="next"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="row">
              <div className="rowContainer">
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

              <div className="rowContainer">
                <CopyToClipboard
                  text={shareUrl}
                  onCopy={() => this.setState({ copiedToClipboard: 'link' })}
                >
                  <button
                    className={`copyButton ${this.state.copiedToClipboard === 'link' ? 'copied' : ''}`}
                  >
                    {this.state.copiedToClipboard === 'link' ? 'Copied!' : 'Copy to clipboard'}
                  </button>
                </CopyToClipboard>
              </div>
            </div>

            {this.state.showEmbed ?
              <div className="row">
                <div className="rowContainer">
                  <h5>Embed code</h5>
                  <textarea
                    ref={(node) => { this.textAreaNode = node; }}
                    onClick={() => {
                      try {
                        this.textAreaNode.setSelectionRange(0, embedCode.length);
                      } catch (e) {
                        // Some browsers lack support for setSelectionRange
                      }
                    }}
                    cols="40"
                    rows="5"
                    defaultValue={embedCode}
                  />
                </div>
                <div className="rowContainer">
                  <CopyToClipboard
                    text={embedCode}
                    onCopy={() => this.setState({ copiedToClipboard: 'embed' })}
                  >
                    <button
                      className={`copyButton ${this.state.copiedToClipboard === 'embed' ? 'copied' : ''}`}
                    >
                      {this.state.copiedToClipboard === 'embed' ? 'Copied!' : 'Copy to clipboard'}
                    </button>
                  </CopyToClipboard>
                </div>
              </div>
              :
              <div className="row">
                <button
                  className="showEmbedButton"
                  onClick={() => this.setState({ showEmbed: true })}
                >
                  Get embed code
                </button>
              </div>
            }

          </div>
          <ModalFooter
            rightButton={{
              text: 'Close',
              onClick: onClose,
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
  canSetPrivacy: PropTypes.bool,
  onSetPassword: PropTypes.func,
};
