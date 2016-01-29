import React, { Component, PropTypes } from 'react';
import Preview from './Preview';

function sourceComponent(source) {
  switch (source.type) {
    case 'DATA_FILE':
      return <span><img src="/assets/data-file.png"/>Data file</span>;
    case 'LINK':
      return <span><img src="/assets/link.png"/>Link</span>;
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
    return (
      <div>
        <dl>
          <dt>Source: </dt>
          <dd>{sourceComponent(this.props.dataset.source)}</dd>

          <dt>File name: </dt>
          <dd>{fileName(this.props.dataset.source)}</dd>

          <dt>Dataset name: </dt>
          <dd><input
            onChange={() => {
              // We should probably not do onChange for perf reasons. Perhaps onBlur?
              this.props.onChange(Object.assign({}, this.props.dataset, {
                name: this.refs.datasetNameInput.value,
              }));
            }}
            ref="datasetNameInput"
            type="text"/></dd>

        </dl>
        <Preview columns={this.props.dataset.columns}/>
      </div>
    );
  }
}

Settings.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
