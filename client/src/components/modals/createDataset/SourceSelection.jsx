import React, { PropTypes } from 'react';

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
  disabled: true,
}, {
  kind: 'WORLD_BANK',
  icon: '/assets/world-bank.png',
  label: 'World Bank',
  disabled: true,
}, {
  kind: 'AKVO_RSR',
  icon: '/assets/akvo-rsr.png',
  label: 'Akvo RSR',
  disabled: true,
}, {
  kind: 'AKVO_FLOW',
  icon: '/assets/akvo-flow.png',
  label: 'Akvo FLOW',
  disabled: false,
}, {
  kind: 'GITHUB',
  icon: '/assets/github.png',
  label: 'Github',
  disabled: true,
}, {
  kind: 'GOOGLE_DRIVE',
  icon: '/assets/google-drive.png',
  label: 'Google Drive',
  disabled: true,
}];

const defaultDataSources = {
  DATA_FILE: {
    kind: 'DATA_FILE',
  },

  LINK: {
    kind: 'LINK',
    url: '',
  },

  AKVO_FLOW: {
    kind: 'AKVO_FLOW',
    instance: null,
    surveyId: null,
  },

  // TODO the rest.
};

export default function SourceSelection({ dataSourceKind, onChangeDataSource }) {
  const sources = supportedFormats.map(source => (
    <div
      className={`sourceOptionContainer ${source.kind} ${source.disabled ? 'disabled' : ''}`}
      key={source.kind}
    >
      <input
        className="sourceOption"
        type="radio"
        name="choose_data_source"
        disabled={source.disabled}
        value={source.kind}
        checked={source.kind === dataSourceKind}
        onChange={evt => {
          onChangeDataSource(defaultDataSources[evt.target.value]);
        }}
      />
      {source.label}
    </div>
  ));
  return <div className="SourceSelection">{sources}</div>;
}

SourceSelection.propTypes = {
  dataSourceKind: PropTypes.string.isRequired,
  onChangeDataSource: PropTypes.func.isRequired,
};
