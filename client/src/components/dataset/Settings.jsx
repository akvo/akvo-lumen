import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fileName from '../../utilities/dataset';

const sourceComponent = (source) => {
  switch (source.kind) {
    case 'DATA_FILE':
      return <span>Data file</span>;
    case 'LINK':
      return <span>Link</span>;
    case 'AKVO_FLOW':
      return <span>Akvo Flow</span>;
    default:
      return <span>{source.kind}</span>;
  }
};

export default class Settings extends Component {

  constructor() {
    super();
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  handleUpdate() {
    this.props.onChangeSettings({
      name: this.datasetNameInput.value,
    });
  }

  render() {
    const { dataset } = this.props;

    return (
      <div className="Settings">
        <dl>
          <dt>Source: </dt>
          <dd>{sourceComponent(dataset.source)}</dd>

          <dt>File name: </dt>
          <dd>{fileName(dataset.source)}</dd>

          <dt>Dataset name: </dt>
          <dd>
            <input
              defaultValue={dataset.name}
              className="datasetNameInput"
              onChange={this.handleUpdate}
              ref={(ref) => { this.datasetNameInput = ref; }}
              type="text"
            />
          </dd>
        </dl>
      </div>
    );
  }
}

Settings.propTypes = {
  dataset: PropTypes.shape({
    name: PropTypes.string,
    source: PropTypes.shape({
      kind: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  onChangeSettings: PropTypes.func.isRequired,
};
