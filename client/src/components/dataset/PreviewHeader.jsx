import React, { PropTypes } from 'react';
import { Cell } from 'fixed-data-table';

export default function PreviewHeader({ title }) {
  return (
    <Cell>
      <div>
        <div>{title}</div>
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

PreviewHeader.propTypes = {
  title: PropTypes.string.isRequired,
};
