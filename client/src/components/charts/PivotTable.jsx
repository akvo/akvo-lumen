import React, { PropTypes } from 'react';

export default function PivotTable({ width, height }) {
  return (
    <div
      className="PivotTable dashChart"
      style={{
        width,
        height,
      }}
    >
      <table>
        <tbody>
          <tr>
            <td>Some data</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

PivotTable.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
