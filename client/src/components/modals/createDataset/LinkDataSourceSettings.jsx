import React, { Component, PropTypes } from 'react';

export default class LinkDataSourceSettings extends Component {
  constructor() {
    super();
    this.handleLink = this.handleLink.bind(this);
  }

  handleLink(evt) {
    const url = evt.target.value.trim();
    this.props.onChange({
      type: 'LINK',
      url,
    });
  }

  render() {
    return (
      <div className="LinkFileSelection">
        <label
          className="linkFileInputLabel"
          htmlFor="linkFileInput">
            Link:
        </label>
        <input
          className="linkFileInput"
          id="linkFileInput"
          type="text"
          placeholder="Paste url here"
          defaultValue={this.props.dataSource.url}
          onChange={this.handleLink}/>
      </div>
    );
  }
}

LinkDataSourceSettings.propTypes = {
  onChange: PropTypes.func.isRequired,
  dataSource: PropTypes.shape({
    type: PropTypes.oneOf(['LINK']).isRequired,
    url: PropTypes.string.isRequired,
  }),
};
