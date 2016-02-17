import React, { Component, PropTypes } from 'react';
import * as csv from '../../../parsers/csv';

export default class LinkFileSelection extends Component {
  constructor() {
    super();
    this.handleLink = this.handleLink.bind(this);
  }

  handleLink(evt) {
    const url = evt.target.value.trim();
    if (url !== '') {
      fetch(url).then(response => {
        if (response.status === 200) {
          return response.text();
        }
      }).then(text => {
        const columns = csv.parse(text, { separator: ',', isFirstRowHeader: true });
        this.props.onChange(Object.assign({}, this.props.dataset, {
          columns,
          source: {
            type: 'LINK',
            url,
            mimeType: 'text/csv',
          },
        }));
      });
    }
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
          onChange={this.handleLink}/>
      </div>
    );
  }
}

LinkFileSelection.propTypes = {
  onChange: PropTypes.func.isRequired,
  dataset: PropTypes.object.isRequired,
};
