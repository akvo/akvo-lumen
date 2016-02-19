import React, { Component, PropTypes } from 'react';
import * as csv from '../../../parsers/csv';

export default class DataFileDataSourceSettings extends Component {
  constructor() {
    super();
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }

  handleDragEnter(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }

  handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }

  handleDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.uploadFile(evt.dataTransfer.files[0]);
  }

  uploadFile(file) {
    const reader = new FileReader();
    reader.addEventListener('loadend', () => {
      this.props.onChange(Object.assign({}, this.props.dataset, {
        columns: csv.parse(reader.result, { separator: ',', isFirstRowHeader: true }),
        source: {
          type: 'DATA_FILE',
          name: file.name,
          mimeType: 'text/csv',
        },
      }));
    });
    reader.readAsText(file);
  }

  render() {
    return (
      <div
        className="DataFileFileSelection"
        onDragEnter={this.handleDragEnter}
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}>
        <p className="dataFileUploadMessage">Drop file anywhere to upload</p>
        <p className="dataFileUploadMessage">or</p>
        <input
          className="dataFileUploadInput"
          ref="fileInput"
          type="file"
          onChange={() => {
            this.uploadFile(this.refs.fileInput.files[0]);
          }}/>
      </div>
    );
  }
}

DataFileDataSourceSettings.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
