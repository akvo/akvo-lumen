import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import EntityTitleInput from './EntityTitleInput';

require('./EntityTypeHeader.scss');

export default class EntityTypeHeader extends Component {

  constructor() {
    super();
    this.state = {
      titleEditModeActive: false,
    };
  }

  render() {
    const { title, saveStatus, actionButtons, onChangeTitle, onBeginEditTitle } = this.props;
    return (
      <nav className="EntityTypeHeader">
        <Link
          className="backButton"
          to="/library"
        >
          <i className="fa fa-arrow-left" aria-hidden="true" />
        </Link>
        <div className="entityInfo">
          <EntityTitleInput
            title={title}
            onBeginEditTitle={onBeginEditTitle}
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
                className={`overflow clickable ${button.customClass ? button.customClass : ''}`}
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
  onBeginEditTitle: PropTypes.func,
  onChangeTitle: PropTypes.func,
};
