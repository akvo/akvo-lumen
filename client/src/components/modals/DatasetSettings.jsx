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
        style={{
          content: {
            width: 600,
            height: 300,
            marginLeft: 'auto',
            marginRight: 'auto',
          },
          overlay: {
            zIndex: 99,
          },
        }}
      >
        <div className={this.props.containerClassName}>
          <div className="DatasetSettings">
            <h2 className="modalTitle">Dataset Settings</h2>
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
                className="cancel clickable negative"
                onClick={() => {
                  this.setState({ name: '' });
                  onCancel();
                }}>
                Cancel
              </button>
              <button
                className="create clickable positive"
                disabled={this.state.name === ''}
                onClick={() => {
                  onSubmit(saveDatasetSettings(dataset.id, this.state));
                  this.setState({ name: '' });
                }}>
                Save
              </button>
            </div>
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
  containerClassName: PropTypes.string,
};

function mapStateToProps(state, ownProps) {
  const dataset = state.library.datasets[ownProps.id];
  return {
    dataset,
  };
}

export default connect(mapStateToProps)(DatasetSettings);
