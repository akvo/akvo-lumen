import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

require('./SourceSelection.scss');

const supportedFormats = [{
  kind: 'AKVO_FLOW',
  icon: '/assets/akvo-flow.png',
  label: <FormattedMessage id="akvo_flow" />,
  disabled: false,
}, {
  kind: 'DATA_FILE',
  icon: '/assets/data-file.png',
  label: <FormattedMessage id="data_file" />,
  disabled: false,
}, {
  kind: 'LINK',
  icon: '/assets/link.png',
  label: <FormattedMessage id="link" />,
  disabled: false,
}, {
  kind: 'DROPBOX',
  icon: '/assets/dropbox.png',
  label: <FormattedMessage id="dropbox" />,
  disabled: true,
}, {
  kind: 'WORLD_BANK',
  icon: '/assets/world-bank.png',
  label: <FormattedMessage id="world_bank" />,
  disabled: true,
}, {
  kind: 'AKVO_RSR',
  icon: '/assets/akvo-rsr.png',
  label: <FormattedMessage id="akvo_rsr" />,
  disabled: true,
}, {
  kind: 'GITHUB',
  icon: '/assets/github.png',
  label: <FormattedMessage id="github" />,
  disabled: true,
}, {
  kind: 'GOOGLE_DRIVE',
  icon: '/assets/google-drive.png',
  label: <FormattedMessage id="google_drive" />,
  disabled: true,
}, {
  kind: 'GEOTIFF',
  icon: '/assets/geotiff.png',
  label: <FormattedMessage id="geotiff" />,
  disabled: false,
}];

const defaultDataSources = {
  DATA_FILE: {
    kind: 'DATA_FILE',
    hasColumnHeaders: true,
    guessColumnTypes: true,
  },

  LINK: {
    kind: 'LINK',
    url: '',
    hasColumnHeaders: true,
    guessColumnTypes: true,
  },

  AKVO_FLOW: {
    kind: 'AKVO_FLOW',
    instance: null,
    surveyId: null,
  },

  GEOTIFF: {
    kind: 'GEOTIFF',
  },
};

export default function SourceSelection({ dataSourceKind, onChangeDataSource }) {
  const sources = supportedFormats.map(source => (
    <div
      className={`sourceOptionContainer ${source.kind} ${source.disabled ? 'notImplemented' : ''}`}
      key={source.kind}
    >
      <input
        data-test-id="source-option"
        className="sourceOption"
        type="radio"
        name="choose_data_source"
        disabled={source.disabled}
        value={source.kind}
        checked={source.kind === dataSourceKind}
        onChange={(evt) => {
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
