import React, { Component, PropTypes } from 'react';
import Modal from 'react-modal';
import SourceSelection from './createDataset/SourceSelection';
import FileSelection from './createDataset/FileSelection';
import Settings from '../dataset/Settings';
import { createDataset } from '../../actions/dataset';

require('../../styles/CreateDataset.scss');

export default class CreateDataset extends Component {

  constructor() {
    super();
    this.state = {
      currentPage: 'source',
      dataset: {
        name: '',
        source: {
          type: 'DATA_FILE',
        },
        columns: null,
      },
    };
  }

  pageComponent(page) {
    const { dataset } = this.state;
    switch (page) {
      case 'source':
        return (
          <SourceSelection
            dataSourceType={dataset.source.type}
            onChangeDataSourceType={newDataSourceType => (
              this.setState({
                dataset: { source: { type: newDataSourceType } },
              })
            )}
          />
      );
      case 'file':
        return (
          <FileSelection
            dataset={dataset}
            onChange={(newDataset) => {
              this.setState({ dataset: newDataset });
            }}
          />
      );
      case 'settings':
        return (
          <Settings
            dataset={dataset}
            onChange={(newDataset) => {
              this.setState({ dataset: newDataset });
            }}
          />
      );
      default: throw new Error(`Not yet implemented: ${page}`);
    }
  }

  handleNextOrImport() {
    const { onSubmit } = this.props;
    const { currentPage, dataset } = this.state;
    if (currentPage === 'source') {
      this.setState({ currentPage: 'file' });
    } else if (currentPage === 'file') {
      this.setState({ currentPage: 'settings' });
    } else if (currentPage === 'settings') {
      onSubmit(createDataset(dataset));
    }
  }

  isNextOrImportDisabled() {
    const { currentPage, dataset } = this.state;
    if (currentPage === 'source') {
      return false;
    } else if (currentPage === 'file') {
      return !dataset.columns;
    } else if (currentPage === 'settings') {
      return !dataset.name;
    }
  }

  handlePrevious() {
    const { currentPage } = this.state;
    if (currentPage === 'settings') {
      this.setState({ currentPage: 'file' });
    } else if (currentPage === 'file') {
      this.setState({ currentPage: 'source' });
    }
  }

  render() {
    const { onCancel } = this.props;
    const { currentPage } = this.state;
    return (
      <Modal isOpen>
        <div className="CreateDataset">
          <h3 className="modalTitle">New Dataset</h3>
          <button className="btn close clickable" onClick={onCancel}>
            X
          </button>
          <ul className="tabMenu">
            <li className={`tab ${currentPage === 'source' ? 'selected' : null}`}>Source</li>
            <li className={`tab ${currentPage === 'file' ? 'selected' : null}`}>File / Project</li>
            <li className={`tab ${currentPage === 'settings' ? 'selected' : null}`}>Settings</li>
          </ul>
          {this.pageComponent(currentPage)}
          <div className={`movementControls ${currentPage}`}>
            <div className="buttonContainer">
              <button
                className="btn previous clickable"
                disabled={currentPage === 'source'}
                onClick={this.handlePrevious.bind(this)}>
                Previous
              </button>
              <button
                className="btn next clickable"
                disabled={this.isNextOrImportDisabled()}
                onClick={this.handleNextOrImport.bind(this)}>
                {currentPage === 'settings' ? 'Import' : 'Next'}
              </button>
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
};
