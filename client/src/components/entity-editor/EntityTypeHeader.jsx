import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import EntityTitleInput from './EntityTitleInput';
import Header from '../common/Header';

require('./EntityTypeHeader.scss');

class EntityTypeHeader extends Component {

  constructor() {
    super();
    this.state = {
      titleEditModeActive: false,
    };
  }

  actionButtons() {
    const { actionButtons, intl } = this.props;

    if (actionButtons == null) {
      return [];
    }

    return (
      actionButtons.map((button, index) =>
        <button
          className={`overflow clickable ${button.customClass ? button.customClass : ''}`}
          onClick={button.onClick}
          key={index}
          title={button.tooltipId && intl.formatMessage({ id: button.tooltipId })}
          disabled={button.disabled}
        >
          {button.buttonText}
        </button>
      )
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
        actions={this.actionButtons()}
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
