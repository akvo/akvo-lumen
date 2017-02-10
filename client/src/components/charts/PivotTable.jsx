import React, { PropTypes } from 'react';
import { replaceLabelIfValueEmpty } from '../../utilities/chart';

require('../../styles/PivotTable.scss');

export default function PivotTable({ width, height, visualisation }) {
  const data = visualisation.data;

  if (!data) {
    return (
      <div
        className="PivotTable dashChart"
        style={{
          width,
          height,
        }}
      >
        Please choose a dataset.
      </div>
    );
  }

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
            {data.columns.map((cell, index) =>
              <th key={index}>{replaceLabelIfValueEmpty(cell.title)}</th>
            )}
          </tr>
          {data.rows.map((row, rowIndex) =>
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                <td key={cellIndex}>
                  {cellIndex === 0 ? replaceLabelIfValueEmpty(cell) : cell}
                </td>
              )}
            </tr>
          )}
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
