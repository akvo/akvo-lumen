import React, { Component, PropTypes } from 'react';

require('../../styles/EditVisualisationHeader.scss');

export default class EditVisualisationHeader extends Component {
  render() {
    let saveStatus;

    switch (this.props.visualisation.isUnsavedChanges) {
      case false:
        saveStatus = 'All changes saved';
        break;
      case true:
        saveStatus = 'Unsaved changes';
        break;
      default:
        saveStatus = '';
    }

    return (
      <nav className="EditVisualisationHeader">
        <div className="visualisationInfo">
          <h3>
            {this.props.visualisation.name || 'Untitled visualisation'}
          </h3>
          <div className="saveStatus">
            {saveStatus}
          </div>
        </div>
        <div className="controls">
          <button className="userMenu clickable">User</button>
          <button className="download clickable">Download</button>
          <button className="share clickable">Share</button>
          <button className="overflow clickable">Overflow</button>
        </div>
      </nav>
    );
  }
}

EditVisualisationHeader.propTypes = {
  visualisation: PropTypes.object.isRequired,
};
