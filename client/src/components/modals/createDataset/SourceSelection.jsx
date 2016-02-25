import React, { Component, PropTypes } from 'react';

const supportedFormats = [{
  kind: 'DATA_FILE',
  icon: '/assets/data-file.png',
  label: 'Data file',
}, {
  kind: 'LINK',
  icon: '/assets/link.png',
  label: 'Link',
}, {
  kind: 'DROPBOX',
  icon: '/assets/dropbox.png',
  label: 'Dropbox',
}, {
  kind: 'WORLD_BANK',
  icon: '/assets/world-bank.png',
  label: 'World Bank',
}, {
  kind: 'AKVO_RSR',
  icon: '/assets/akvo-rsr.png',
  label: 'Akvo RSR',
}, {
  kind: 'AKVO_FLOW',
  icon: '/assets/akvo-flow.png',
  label: 'Akvo FLOW',
}, {
  kind: 'GITHUB',
  icon: '/assets/github.png',
  label: 'Github',
}, {
  kind: 'GOOGLE_DRIVE',
  icon: '/assets/google-drive.png',
  label: 'Google Drive',
}];

const defaultDataSources = {
  DATA_FILE: {
    kind: 'DATA_FILE',
  },

  LINK: {
    kind: 'LINK',
    url: '',
  },

  // TODO the rest.
};

export default class SourceSelection extends Component {
  render() {
    const sources = supportedFormats.map(source => (
      <div className="sourceOptionContainer" key={source.kind}>
        <input
          type="radio"
          name="choose_data_source"
          value={source.kind}
          checked={source.kind === this.props.dataSourceKind}
          onChange={evt => {
            this.props.onChangeDataSource(defaultDataSources[evt.target.value]);
          }} />
        {source.label}
      </div>
    ));
    return <div className="SourceSelection">{sources}</div>;
  }
}

SourceSelection.propTypes = {
  dataSourceKind: PropTypes.string.isRequired,
  onChangeDataSource: PropTypes.func.isRequired,
};
