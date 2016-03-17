import React, { PropTypes } from 'react';

require('../../styles/EntityTypeHeader.scss');

export default function EntityTypeHeader({ title, saveStatus, actionButtons }) {
  return (
    <nav className="EntityTypeHeader">
      <div className="entityInfo">
        <h3 className="entityTitle">
          {title}
        </h3>
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
              disabled
            >
              {button.buttonText}
            </button>
          )
        }
      </div>
    </nav>
  );
}

EntityTypeHeader.propTypes = {
  title: PropTypes.string.isRequired,
  saveStatus: PropTypes.string,
  actionButtons: PropTypes.array,
};
