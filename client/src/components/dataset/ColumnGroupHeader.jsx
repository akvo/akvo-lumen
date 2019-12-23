import React, { Component } from 'react';
import PropTypes from 'prop-types';

require('./ColumnGroupHeader.scss');

export default class ColumnGroupHeader extends Component {

  render() {
    const { groupName } = this.props;
    return (
      <div
        className="ColumnGroupHeader"
        ref={(ref) => { this.columnHeaderContainer = ref; }}
      >
        {groupName}
      </div>
    );
  }
}

ColumnGroupHeader.propTypes = {
  groupName: PropTypes.string.isRequired,
};
