import React, { Component, PropTypes } from 'react';
import EntityTitleInput from './EntityTitleInput';

require('../../styles/EntityTypeHeader.scss');

export default class EntityTypeHeader extends Component {

  constructor() {
    super();
    this.state = {
      titleEditModeActive: false,
    };
  }

  render() {
    const { title, saveStatus, actionButtons, onChangeTitle } = this.props;
    return (
      <nav className="EntityTypeHeader">
        <div className="entityInfo">
          <EntityTitleInput
            title={title}
            onChangeTitle={onChangeTitle}
          />
          {saveStatus &&
            <div className="saveStatus">
              {saveStatus}
            </div>
          }
        </div>
        <div className="controls">
          {actionButtons &&
            actionButtons.map((button, index) =>
              <button
                className="overflow clickable"
                onClick={button.onClick}
                key={index}
              >
                {button.buttonText}
              </button>
            )
          }
        </div>
      </nav>
    );
  }
}

EntityTypeHeader.propTypes = {
  title: PropTypes.string.isRequired,
  saveStatus: PropTypes.string,
  actionButtons: PropTypes.array,
  onChangeTitle: PropTypes.func,
};
