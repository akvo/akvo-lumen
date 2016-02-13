import React, { Component, PropTypes } from 'react';

function sourceComponent(source) {
  switch (source.type) {
    case 'DATA_FILE':
      return <span>Data file</span>;
    case 'LINK':
      return <span>Link</span>;
    default:
      return <span>{source.type}</span>;
  }
}

function fileName(source) {
  switch (source.type) {
    case 'DATA_FILE':
      return source.name;
    case 'LINK':
      return source.url.substring(source.url.lastIndexOf('/') + 1);
    default: return 'Unknown';
  }
}

export default class Settings extends Component {

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
              onChange={() => {
                // We should probably not do onChange for perf reasons. Perhaps onBlur?
                this.props.onChangeName({ name: this.refs.datasetNameInput.value });
              }}
              ref="datasetNameInput"
              type="text"/>
          </dd>
        </dl>
      </div>
    );
  }
}

Settings.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChangeName: PropTypes.func.isRequired,
  showPreview: PropTypes.bool.isRequired,
};
