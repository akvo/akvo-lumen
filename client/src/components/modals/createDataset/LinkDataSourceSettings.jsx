import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

export function isValidSource(source) {
  return (
    source.kind === 'LINK' &&
    source.url
  );
}

class LinkDataSourceSettings extends Component {

  constructor() {
    super();
    this.handleLink = this.handleLink.bind(this);
  }

  handleLink(evt) {
    const url = evt.target.value.trim();
    this.props.onChange({
      kind: 'LINK',
      url,
    });
  }

  render() {
    const { formatMessage } = this.props.intl;
    return (
      <div className="LinkFileSelection">
        <div>
          <label
            className="linkFileInputLabel"
            htmlFor="linkFileInput"
          >
            <FormattedMessage id="link" />:
          </label>
          <input
            className="linkFileInput"
            id="linkFileInput"
            type="text"
            placeholder={formatMessage({ id: 'paste_url_here' })}
            defaultValue={this.props.dataSource.url}
            onChange={this.handleLink}
          />
        </div>
        <div className="dataFileUploadHeaderToggle">
          <p>
            <input
              type="checkbox"
              defaultChecked={this.props.dataSource.hasColumnHeaders}
              ref={(ref) => { this.datasetHeaderStatusToggle = ref; }}
              onClick={() => {
                this.props.onChange({
                  hasColumnHeaders: this.datasetHeaderStatusToggle.checked,
                });
              }}
            /> <FormattedMessage id="file_has_column_headers" />
          </p>
          <p>
            <input
              type="checkbox"
              defaultChecked={this.props.dataSource.guessColumnTypes}
              ref={(ref) => { this.guessColumnTypes = ref; }}
              onClick={() => {
                this.props.onChange({
                  guessColumnTypes: this.guessColumnTypes.checked,
                });
              }}
            /> <FormattedMessage id="autodetect_column_types" />
          </p>
        </div>
      </div>
    );
  }
}

LinkDataSourceSettings.propTypes = {
  intl: intlShape.isRequired,
  onChange: PropTypes.func.isRequired,
  dataSource: PropTypes.shape({
    kind: PropTypes.oneOf(['LINK']).isRequired,
    url: PropTypes.string.isRequired,
    hasColumnHeaders: PropTypes.bool.isRequired,
    guessColumnTypes: PropTypes.bool.isRequired,
  }),
};

export default injectIntl(LinkDataSourceSettings);
