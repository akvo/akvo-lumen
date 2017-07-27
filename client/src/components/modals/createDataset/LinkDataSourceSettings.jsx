import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';

class LinkDataSourceSettings extends Component {

  static isValidSource(source) {
    return (
      source.kind === 'LINK' &&
      source.url
    );
  }

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
        <div>
          <label
            className="linkFileToggleLabel"
            htmlFor="dataHasColumnHeadersCheckbox"
          >
            <FormattedMessage id="data_has_column_headers" />:
          </label>
          <input
            id="dataHasColumnHeadersCheckbox"
            type="checkbox"
            defaultChecked={this.props.dataSource.hasColumnHeaders}
            ref={(ref) => { this.datasetHeaderStatusToggle = ref; }}
            onClick={() => {
              this.props.onChange({
                hasColumnHeaders: this.datasetHeaderStatusToggle.checked,
              });
            }}
          />
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
  }),
};

export default injectIntl(LinkDataSourceSettings);
