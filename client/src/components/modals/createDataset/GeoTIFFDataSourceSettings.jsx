import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import * as tus from 'tus-js-client';
import * as auth from '../../../auth';
import ProgressBar from '../../common/ProgressBar';

const handleDragEnter = (evt) => {
  evt.stopPropagation();
  evt.preventDefault();
};

const handleDragOver = (evt) => {
  evt.stopPropagation();
  evt.preventDefault();
};

export function isValidSource(source) {
  return (
    source.kind === 'GEOTIFF' &&
    source.url &&
    source.fileName
  );
}

export default class GeoTIFFDataSourceSettings extends Component {

  constructor() {
    super();
    this.handleDrop = this.handleDrop.bind(this);
    this.handleProgress = this.handleProgress.bind(this);
    this.state = { uploadProgressPercentage: null };
  }

  isProgressBarVisible() {
    return this.state.uploadProgressPercentage !== null;
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
    const updateUploadStatus = this.props.updateUploadStatus;
    const handleProgress = this.handleProgress;
    auth.token().then((token) => {
      const upload = new tus.Upload(file, {
        chunkSize: 1 * 1024 * 1024,
        headers: { Authorization: `Bearer ${token}` },
        endpoint: '/api/files',
        onError() {
          updateUploadStatus(false);
          handleProgress(-1);
        },
        onProgress(bytesUploaded, bytesTotal) {
          const percentage = parseFloat(((bytesUploaded / bytesTotal) * 100).toFixed(2));
          handleProgress(percentage);
        },
        onSuccess() {
          updateUploadStatus(false);
          onChange({
            kind: 'GEOTIFF',
            url: upload.url,
            fileName: upload.file.name,
          });
        },
      });
      upload.start();
      handleProgress(0);
      updateUploadStatus(true);
    });
  }

  render() {
    return (
      <div
        className="DataFileFileSelection"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDrop={this.handleDrop}
      >
        <p className="dataFileUploadMessage">
          <i className="fa fa-download" aria-hidden="true" />{' '}
          <FormattedMessage id="drop_file_anywhere" />
        </p>
        <p className="dataFileUploadMessage">
          <FormattedMessage id="or" />
        </p>
        <p>
          <input
            className={`dataFileUploadInput${this.isProgressBarVisible() ? ' progressActive' : ''}`}
            ref={(ref) => { this.fileInput = ref; }}
            type="file"
            onChange={() => {
              this.uploadFile(this.fileInput.files[0]);
            }}
          />
        </p>
        <div className="dataFileUploadHeaderToggle">
        </div>
        {this.isProgressBarVisible() &&
          <div>
            <ProgressBar
              progressPercentage={this.state.uploadProgressPercentage}
              errorText="Error"
              completionText="Success"
            />
            {this.state.uploadProgressPercentage === -1 &&
              <span className="errorText">
                GEOTIFF file upload failed. Please try again.
              </span>
            }
          </div>
        }
      </div>
    );
  }
}

GeoTIFFDataSourceSettings.propTypes = {
  dataSource: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  updateUploadStatus: PropTypes.func.isRequired,
};
