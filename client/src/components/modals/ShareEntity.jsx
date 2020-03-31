/* eslint-disable no-nested-ternary */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import ModalWrapper from 'react-modal';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import ToggleInput from '../common/ToggleInput';
import { trackEvent } from '../../utilities/analytics';
import { GET_EMBED_CODE } from '../../constants/analytics';

require('./ShareEntity.scss');

export default class ShareEntity extends Component {

  constructor() {
    super();
    this.state = {
      copiedToClipboard: null,
      showEmbed: false,
      protected: false,
    };
    this.handleSavePassword = this.handleSavePassword.bind(this);
    this.handleChangePassword = this.handleChangePassword.bind(this);
    this.handleToggleProtected = this.handleToggleProtected.bind(this);
    this.handleFocusPassword = this.handleFocusPassword.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.isOpen) {
      return { copiedToClipboard: null, showEmbed: false };
    }
    return state;
  }

  handleChangePassword(event) {
    this.setState({ password: event.target.value });
  }

  handleSavePassword() {
    this.props.onSetPassword(this.state.password);
  }

  handleToggleProtected(isProtected) {
    this.setState({ protected: isProtected });
    this.props.onToggleProtected(isProtected);
  }

  handleFocusPassword() {
    if (!this.state.password) {
      this.passwordInput.value = '';
    }
  }

  render() {
    const { type, title, onClose, isOpen, canSetPrivacy, onFetchShareId, shareId } = this.props;
    const shareUrl = `${window.location.origin}/s/${shareId}`;
    const defaultHeight = type === 'visualisation' ? '500px' : '1000px';
    const embedCode = `<iframe width="100%" height="${defaultHeight}" src="${shareUrl}" frameborder="0" allow="encrypted-media"></iframe>`;

    return (
      <ModalWrapper
        isOpen={isOpen}
        onAfterOpen={onFetchShareId}
        contentLabel="userInviteModal"
        style={{
          content: {
            width: 500,
            minHeight: 320,
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
                    checked={this.props.protected || this.state.protected}
                    label="Password protected"
                    onChange={this.handleToggleProtected}
                  />
                </div>
              </div>
            )}

            {(canSetPrivacy && (this.props.protected || this.state.protected)) && (
              <div className="row privacyContainer">
                <div className="rowContainer">
                  <input
                    placeholder="Password"
                    type="password"
                    onChange={this.handleChangePassword}
                    value={
                      (typeof this.state.password !== 'undefined') ?
                        this.state.password :
                        (this.props.protected ? '.......' : '')
                    }
                    onFocus={this.handleFocusPassword}
                    ref={(c) => { this.passwordInput = c; }}
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

            {this.props.alert && (
              <div className="row">
                <div className="rowContainer">
                  <div className={`alert alert-${this.props.alert.type || 'success'}`}>
                    {this.props.alert.message}
                  </div>
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
                  onClick={() => {
                    trackEvent(GET_EMBED_CODE, type, shareUrl);
                    this.setState({ showEmbed: true });
                  }}
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
  title: PropTypes.string,
  type: PropTypes.string,
  shareId: PropTypes.string,
  canSetPrivacy: PropTypes.bool,
  protected: PropTypes.bool,
  onToggleProtected: PropTypes.func,
  onSetPassword: PropTypes.func,
  onFetchShareId: PropTypes.func,
  alert: PropTypes.shape({
    message: PropTypes.string,
    type: PropTypes.string,
  }),
};
