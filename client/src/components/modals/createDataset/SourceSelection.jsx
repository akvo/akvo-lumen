import React, { Component, PropTypes } from 'react';

const supportedFormats = [{
  type: 'DATA_FILE',
  icon: '/assets/data-file.png',
  label: 'Data file',
}, {
  type: 'LINK',
  icon: '/assets/link.png',
  label: 'Link',
}, {
  type: 'DROPBOX',
  icon: '/assets/dropbox.png',
  label: 'Dropbox',
}, {
  type: 'WORLD_BANK',
  icon: '/assets/world-bank.png',
  label: 'World Bank',
}, {
  type: 'AKVO_RSR',
  icon: '/assets/akvo-rsr.png',
  label: 'Akvo RSR',
}, {
  type: 'AKVO_FLOW',
  icon: '/assets/akvo-flow.png',
  label: 'Akvo FLOW',
}, {
  type: 'GITHUB',
  icon: '/assets/github.png',
  label: 'Github',
}, {
  type: 'GOOGLE_DRIVE',
  icon: '/assets/google-drive.png',
  label: 'Google Drive',
}];

const defaultDataSources = {
  'DATA_FILE': {
    type: 'DATA_FILE'
  },

  'LINK': {
    type: 'LINK',
    url: '',
  },

  // TODO the rest.
}

export default class SourceSelection extends Component {
  render() {
    const sources = supportedFormats.map(source => (
      <div className="sourceOptionContainer" key={source.type}>
        <input
          type="radio"
          name="choose_data_source"
          value={source.type}
          checked={source.type === this.props.dataSourceType}
          onChange={evt => {
            this.props.onChangeDataSource(defaultDataSources[evt.target.value])
          }}/>
        { /* <img src={source.icon}/> */ }
        {source.label}
      </div>
    ));
    return <div className="SourceSelection">{sources}</div>;
  }
}

SourceSelection.propTypes = {
  dataSourceType: PropTypes.string.isRequired,
  onChangeDataSource: PropTypes.func.isRequired,
};
