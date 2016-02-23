import React, { Component, PropTypes } from 'react';
import * as tus from 'tus-js-client';

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
    const upload = new tus.Upload(file, {
      endpoint: 'http://localhost:3030/api/files',
      onError(error) {
        console.log(`Failed because: ${error}`);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, `${percentage}%`);
      },
      onSuccess() {
        console.log(`Download ${upload.file.name} from ${upload.url}`);
      },
    });
    upload.start();
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
          }} />
      </div>
    );
  }
}

DataFileDataSourceSettings.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
