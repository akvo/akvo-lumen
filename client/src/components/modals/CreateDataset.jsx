import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import SourceSelection from './createDataset/SourceSelection';
import DataSourceSettings from './createDataset/DataSourceSettings';
import Settings from '../dataset/Settings';
import * as actionCreators from '../../actions/dataset';

require('../../styles/CreateDataset.scss');

class CreateDataset extends Component {

  constructor() {
    super();
    this.handleNextOrImport = this.handleNextOrImport.bind(this);
    this.isValidImport = this.isValidImport.bind(this);
  }

  pageComponent(page) {
    const { currentPage, dataset } = this.props.datasetImport;
    switch (currentPage) {
      case 'select-data-source-type':
        return (
          <SourceSelection
            dataSourceKind={dataset.source.kind}
            onChangeDataSource={this.props.selectDataSource}
          />
        );
      case 'define-data-source':
        return (
          <DataSourceSettings
            dataSource={dataset.source}
            onChange={this.props.defineDataSource}
            onChangeSettings={this.props.defineDatasetSettings}
            updateUploadStatus={this.props.updateDatasetUploadStatus}
          />
        );
      case 'define-dataset':
        return (
          <Settings
            dataset={dataset}
            onChangeSettings={this.props.defineDatasetSettings}
          />
        );
      default: throw new Error(`Not yet implemented: ${page}`);
    }
  }

  handleNextOrImport() {
    const { currentPage, dataset } = this.props.datasetImport;
    if (currentPage === 'define-dataset') {
      this.props.importDataset(dataset);
      this.props.clearImport();
    } else {
      this.props.nextPage();
    }
  }

  isValidImport() {
    const dataset = this.props.datasetImport.dataset;
    return DataSourceSettings.isValidSource(dataset.source) && dataset.name !== '';
  }

  render() {
    const { onCancel, datasetImport, clearImport } = this.props;
    const { currentPage, uploadRunning } = datasetImport;

    return (
      <Modal
        isOpen
        style={{
          content: {
            borderRadius: 0,
            border: '0.1rem solid rgb(223, 244, 234)',
            marginLeft: '7rem',
            marginRight: '7rem',
          },
          overlay: {
            zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.6)',
          },
        }}
      >
        <div className={this.props.containerClassName}>
          <div className="CreateDataset">
            <h3 className="modalTitle">New Dataset</h3>
            <div
              className="btn close clickable"
              onClick={() => {
                clearImport();
                onCancel();
              }}
            >
              +
            </div>
            <ul className="tabMenu">
              <li
                className={`tab ${currentPage === 'select-data-source-type' ? 'selected' : null}`}
              >
                Source
              </li>
              <li className={`tab ${currentPage === 'define-data-source' ? 'selected' : null}`}>
                File / Project
              </li>
              <li className={`tab ${currentPage === 'define-dataset' ? 'selected' : null}`}>
                Settings
              </li>
            </ul>
            {this.pageComponent(currentPage)}
            <div className={`controls ${currentPage}`}>
              <div className="buttonContainer">
                <button
                  className="btn previous clickable negative"
                  disabled={currentPage === 'select-data-source-type' || uploadRunning}
                  onClick={this.props.previousPage}
                >
                  Previous
                </button>
                <button
                  className="btn next clickable positive"
                  disabled={currentPage === 'define-dataset' ? !this.isValidImport() : false
                    || uploadRunning}
                  onClick={this.handleNextOrImport}
                >
                  {currentPage === 'define-dataset' ? 'Import' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

CreateDataset.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  previousPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  updateDatasetUploadStatus: PropTypes.func.isRequired,
  defineDatasetSettings: PropTypes.func.isRequired,
  defineDataSource: PropTypes.func.isRequired,
  selectDataSource: PropTypes.func.isRequired,
  importDataset: PropTypes.func.isRequired,
  clearImport: PropTypes.func.isRequired,
  datasetImport: PropTypes.shape({
    currentPage: PropTypes.string.isRequired,
    dataset: PropTypes.object.isRequired, // TODO: shape?
  }),
  containerClassName: PropTypes.string,
};


function mapStateToProps(state, ownProps) {
  return {
    onSubmit: ownProps.onSubmit,
    onCancel: ownProps.onCancel,
    datasetImport: state.library.datasetImport,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actionCreators, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateDataset);
