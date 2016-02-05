import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import Settings from '../dataset/Settings';
import { saveDatasetSettings } from '../../actions/dataset';

class DatasetSettings extends Component {
  constructor(props) {
    super(props);
    const { dataset } = this.props;
    this.state = { name: dataset.name };
    this.handleChangeName = this.handleChangeName.bind(this);
  }

  handleChangeName(newName) {
    this.setState({ name: newName });
  }

  render() {
    const { onCancel, onSubmit, dataset } = this.props;
    return (
      <Modal
        isOpen
        style={{ overlay: { zIndex: 1 } }}>
        <div className="DatasetSettings">
          <h2 className="title">Dataset Settings</h2>
          <button
            className="close clickable"
            onClick={() => {
              this.setState({ name: '' });
              onCancel();
            }}>
            X
          </button>
          <Settings
            dataset={dataset}
            showPreview={false}
            onChangeName={this.handleChangeName}/>
          <div className="controls">
            <button
              className="cancel clickable"
              onClick={() => {
                this.setState({ name: '' });
                onCancel();
              }}>
              Cancel
            </button>
            <button
              className="create clickable"
              disabled={this.state.name === ''}
              onClick={() => {
                onSubmit(saveDatasetSettings(dataset.id, this.state));
                this.setState({ name: '' });
              }}>
              Save
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}

DatasetSettings.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  dataset: PropTypes.object.isRequired,
};

function mapStateToProps(state, ownProps) {
  const dataset = state.library.datasets[ownProps.id];
  return {
    dataset,
  };
}

export default connect(mapStateToProps)(DatasetSettings);
