import React, { Component, PropTypes } from 'react';
import SelectMenu from '../../common/SelectMenu';

const parseFormatOptions = [
  {
    value: 'YYYY-MM-DD',
    label: 'YYYY-MM-DD',
  },
  {
    value: 'DD-MM-YYYY',
    label: 'DD-MM-YYYY',
  },
  {
    value: 'MM-DD-YYYY',
    label: 'MM-DD-YYYY',
  },
  {
    value: 'CUSTOM',
    label: 'Custom',
  },
];

export default class DateFormatSelect extends Component {

  constructor() {
    super();
    this.state = {
      parseFormat: 'YYYY-MM-DD',
      customParseFormat: null,
    };
  }

  onSelectMenuChange(parseFormat) {
    if (parseFormat === 'CUSTOM') {
      this.setState({
        customParseFormat: '',
        parseFormat: 'CUSTOM' });
    } else {
      this.setState({
        customParseFormat: null,
        parseFormat,
      });
    }
    this.props.onChange(parseFormat === 'CUSTOM' ? '' : parseFormat);
  }

  onCustomParseFormatChange(customParseFormat) {
    this.setState({ customParseFormat });
    this.props.onChange(customParseFormat);
  }

  render() {
    const { parseFormat, customParseFormat } = this.state;

    return (
      <div className="inputGroup">
        <label htmlFor="parseFormatMenu">
          Date format:
        </label>
        <SelectMenu
          name="parseFormatMenu"
          value={parseFormat}
          options={parseFormatOptions}
          onChange={format => this.onSelectMenuChange(format)}
        />
        {customParseFormat != null &&
          <input
            value={customParseFormat}
            type="text"
            className="customParseFormatInput"
            onChange={evt => this.onCustomParseFormatChange(evt.target.value)}
          />
        }
      </div>
    );
  }
}


DateFormatSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
};
