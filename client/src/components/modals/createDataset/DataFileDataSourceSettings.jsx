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

  isProgressBarVisible() {
    return this.state.uploadProgressPercentage !== null;
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
    this.setState({ uploadProgressPercentage: percentage });
  }

  uploadFile(file) {
    const onChange = this.props.onChange;
    const handleProgress = this.handleProgress;
    const upload = new tus.Upload(file, {
      headers: { Authorization: `Bearer ${keycloak.token}` },
      endpoint: '/api/files',
      onError(error) {
        console.error(`Failed because: ${error}`);
        handleProgress(-1);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percentage = parseFloat((bytesUploaded / bytesTotal * 100).toFixed(2));
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
          className={`dataFileUploadInput${this.isProgressBarVisible() ? ' progressActive' : ''}`}
          ref="fileInput"
          type="file"
          onChange={() => {
            this.uploadFile(this.refs.fileInput.files[0]);
          }}
        />
        { this.isProgressBarVisible() &&
          <DashProgressBar
            progressPercentage={this.state.uploadProgressPercentage}
            errorText="Error"
            completionText="Success"
          />
        }
      </div>
    );
  }
}

DataFileDataSourceSettings.propTypes = {
  onChange: PropTypes.func.isRequired,
};
