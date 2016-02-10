import React, { Component, PropTypes } from 'react';

require('../../styles/EntityTypeHeader.scss');

export default class EntityTypeHeader extends Component {
  render() {
    return (
      <nav className="EntityTypeHeader">
        <div className="entityInfo">
          <h3>
            {this.props.title}
          </h3>
          {this.props.saveStatus &&
            <div className="saveStatus">
              {this.props.saveStatus}
            </div>
          }
        </div>
        <div className="controls">
          {this.props.actionButtons &&
            this.props.actionButtons.map((button, index) =>
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
};
