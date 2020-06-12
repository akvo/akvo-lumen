import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedRelative, injectIntl, intlShape } from 'react-intl';

import EntityTitleInput from './EntityTitleInput';
import Header from '../common/Header';
import ContextMenu from '../common/ContextMenu';

require('./EntityTypeHeader.scss');

const IS_PRIMARY = true;

function EntityTypeHeader(props) {
  const [menuActive, setMenuActive] = useState(null);

  const actionButtonsFun = (isPrimary = false) => {
    const { actionButtons, intl } = props;

    if (actionButtons == null) return null;

    return (
      <ul>
        {actionButtons
          .filter(({ primary = false }) => (isPrimary && primary) || (!isPrimary && !primary))
          .map((button, index) =>
            <li key={index}>
              {button.subActions ? (
                <span>
                  <button
                    className={`overflow sub-action link-button clickable  ${button.customClass ? button.customClass : ''}`}
                    onClick={() => setMenuActive(index)}
                    title={button.tooltipId && intl.formatMessage({ id: button.tooltipId })}
                    disabled={button.disabled}
                    {...(button.props || {})}
                  >
                    {button.icon || null}
                    {button.buttonText}
                  </button>
                  {menuActive === index && (
                    <ContextMenu
                      options={button.subActions}
                      onOptionSelected={button.onOptionSelected}
                      onWindowClick={setMenuActive}
                      subMenuSide="left"
                      style={{
                        left: 0,
                        width: '16rem',
                        textAlign: 'left',
                      }}
                    />
                  )}
                </span>
              ) : (
                <button
                  className={`overflow clickable link-button ${button.customClass ? button.customClass : ''}`}
                  onClick={button.onClick}
                  title={button.tooltipId && intl.formatMessage({ id: button.tooltipId })}
                  disabled={button.disabled}
                  {...(button.props || {})}
                >
                  {button.icon || null}
                  {button.buttonText}
                </button>
              )}
            </li>
          )
        }
      </ul>
    );
  };

  const {
    title,
    saveStatusId,
    onChangeTitle,
    onBeginEditTitle,
    timeToNextSave,
    savingFailed,
    saveAction,
  } = props;

  return (
    <Header
      className="EntityTypeHeader"
      actions={actionButtonsFun()}
      history={props.history}
      primaryActions={actionButtonsFun(IS_PRIMARY)}
    >
      <div className="EntityTypeHeaderContainer">
        <EntityTitleInput
          title={title}
          onBeginEditTitle={onBeginEditTitle}
          onChangeTitle={onChangeTitle}
        />

        {/* hide status when editing */}
        {saveStatusId && saveStatusId !== 'unsaved_changes' && (
          <div className="saveStatus">
            {saveStatusId && <FormattedMessage id={saveStatusId} />}
            {timeToNextSave && savingFailed && (
              <span>
                <FormattedRelative
                  value={new Date().getTime() + timeToNextSave}
                />

                <span
                  data-test-id="save-changes"
                  className="clickable"
                  onClick={saveAction}
                >
                  . <FormattedMessage id="retry" />
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </Header>
  );
}

EntityTypeHeader.propTypes = {
  intl: intlShape.isRequired,
  title: PropTypes.string.isRequired,
  saveStatusId: PropTypes.string,
  actionButtons: PropTypes.array,
  onBeginEditTitle: PropTypes.func,
  onChangeTitle: PropTypes.func,
  timeToNextSave: PropTypes.number,
  savingFailed: PropTypes.bool,
  history: PropTypes.object.isRequired,
  saveAction: PropTypes.func.isRequired,
};

export default injectIntl(EntityTypeHeader);
