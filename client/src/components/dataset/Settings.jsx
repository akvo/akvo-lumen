import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

function sourceComponent(source) {
  switch (source.kind) {
    case 'DATA_FILE':
      return <span><FormattedMessage id="data_file" /></span>;
    case 'LINK':
      return <span><FormattedMessage id="link" /></span>;
    case 'AKVO_FLOW':
      return <span><FormattedMessage id="akvo_flow" /></span>;
    default:
      return <span>{source.kind}</span>;
  }
}

function fileName(source) {
  switch (source.kind) {
    case 'DATA_FILE':
      return source.fileName;
    case 'LINK':
      return source.url.substring(source.url.lastIndexOf('/') + 1);
    case 'AKVO_FLOW':
      return 'Survey';
    case 'GEOTIFF':
      return source.fileName;
    default: return 'Unknown';
  }
}

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
          <dt><FormattedMessage id="source" />: </dt>
          <dd>{sourceComponent(dataset.source)}</dd>

          <dt><FormattedMessage id="file_name" />: </dt>
          <dd>{fileName(dataset.source)}</dd>

          <dt><FormattedMessage id="dataset_name" />: </dt>
          <dd>
            <input
              data-test-id="dataset-name"
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
