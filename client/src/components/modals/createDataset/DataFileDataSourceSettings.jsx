import React, { Component, PropTypes } from 'react';
import * as tus from 'tus-js-client';
import keycloak from '../../../auth';
import DashProgressBar from '../../common/DashProgressBar';

export default class DataFileDataSourceSettings extends Component {

  static isValidSource(source) {
    return (
      source.kind === 'DATA_FILE' &&
      source.url &&
      source.fileName
    );
  }

  constructor() {
    super();
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.state = { uploadProgressPercentage: null };
  }

  getShowProgressBarBool() {
    return this.state.uploadProgressPercentage !== null
      && this.state.uploadProgressPercentage < 100;
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

  handleProgress(percentage) {
    this.setState({ uploadProgressPercentage: parseFloat(percentage) });
  }

  uploadFile(file) {
    const onChange = this.props.onChange;
    const handleProgress = this.handleProgress;
    const upload = new tus.Upload(file, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
      endpoint: '/api/files',
      onError(error) {
        console.error(`Failed because: ${error}`);
        handleProgress(null);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        handleProgress(percentage);
      },
      onSuccess() {
        onChange({
          kind: 'DATA_FILE',
          url: upload.url,
          fileName: upload.file.name,
        });
      },
    });
    upload.start();
    handleProgress(0);
  }

  render() {
    return (
      <div
        className="DataFileFileSelection"
        onDragEnter={this.handleDragEnter}
        onDragOver={this.handleDragOver}
        onDrop={this.handleDrop}
      >
        <p className="dataFileUploadMessage">Drop file anywhere to upload</p>
        <p className="dataFileUploadMessage">or</p>
        <input
          className={`dataFileUploadInput${this.getShowProgressBarBool() ? ' progressActive' : ''}`}
          ref="fileInput"
          type="file"
          onChange={() => {
            this.uploadFile(this.refs.fileInput.files[0]);
          }}
        />
        { this.getShowProgressBarBool() &&
          <DashProgressBar
            progressPercentage={this.state.uploadProgressPercentage}
          />
        }
      </div>
    );
  }
}

DataFileDataSourceSettings.propTypes = {
  onChange: PropTypes.func.isRequired,
};
