import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import EntityTitleInput from './EntityTitleInput';
import Header from '../common/Header';

require('./EntityTypeHeader.scss');

const IS_PRIMARY = true;

class EntityTypeHeader extends Component {

  constructor() {
    super();
    this.state = {
      titleEditModeActive: false,
    };
  }

  actionButtons(isPrimary = false) {
    const { actionButtons, intl } = this.props;

    if (actionButtons == null) return null;

    return (
      <ul>
        {actionButtons
          .filter(({ primary = false }) => (isPrimary && primary) || (!isPrimary && !primary))
          .map((button, index) =>
            <li key={index}>
              <button
                className={`overflow clickable ${button.customClass ? button.customClass : ''}`}
                onClick={button.onClick}
                title={button.tooltipId && intl.formatMessage({ id: button.tooltipId })}
                disabled={button.disabled}
                {...(button.props || {})}
              >
                {button.buttonText}
              </button>
            </li>
          )
        }
      </ul>
    );
  }

  render() {
    const {
      title,
      saveStatusId,
      onChangeTitle,
      onBeginEditTitle } = this.props;

    return (
      <Header
        className="EntityTypeHeader"
        backButtonTarget="/library"
        actions={this.actionButtons()}
        primaryActions={this.actionButtons(IS_PRIMARY)}
      >
        <EntityTitleInput
          title={title}
          onBeginEditTitle={onBeginEditTitle}
          onChangeTitle={onChangeTitle}
        />
        {saveStatusId &&
          <div className="saveStatus">
            <FormattedMessage id={saveStatusId} />
          </div>
        }
      </Header>
    );
  }
}

EntityTypeHeader.propTypes = {
  intl: intlShape.isRequired,
  title: PropTypes.string.isRequired,
  saveStatusId: PropTypes.string,
  actionButtons: PropTypes.array,
  onBeginEditTitle: PropTypes.func,
  onChangeTitle: PropTypes.func,
};

export default injectIntl(EntityTypeHeader);
