import React, { Component, PropTypes } from 'react';
import { Cell } from 'fixed-data-table';

export default class PreviewHeader extends Component {
  render() {
    return (
      <Cell>
        <div>
          <div>{this.props.title}</div>
          <div>
            <select>
              <option>String</option>
              <option>Number</option>
              <option>Date</option>
            </select>
          </div>
        </div>
      </Cell>
    );
  }
}

PreviewHeader.propTypes = {
  title: PropTypes.string.isRequired,
};
