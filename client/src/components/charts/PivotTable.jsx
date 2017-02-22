import React, { PropTypes } from 'react';
import { replaceLabelIfValueEmpty } from '../../utilities/chart';

require('../../styles/PivotTable.scss');

const getColumnHeaderClassname = (cell, index, spec) => {
  if (index === 0) {
    if (spec.rowColumn !== null) {
      return 'rowColumnTitle';
    } else if (spec.categoryColumn !== null) {
      return 'spacer';
    }
    return '';
  }
  return 'uniqueColumnValue';
};

const formatCell = (index, cell, spec, columns) => {
  const type = columns[index].type;

  if (type === 'number') {
    if (!spec.decimalPlaces) {
      return Math.round(cell);
    }
    // eslint-disable-next-line no-restricted-properties
    return Math.round(cell * Math.pow(10, spec.decimalPlaces)) / Math.pow(10, spec.decimalPlaces);
  }

  return cell;
};

const formatTitle = (title) => {
  const maxTitleLength = 64;

  if (title.length <= maxTitleLength) return title;

  return `${title.substring(0, maxTitleLength - 1)}…`;
};

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
        <thead>
          <tr className="title">
            <th colSpan={data.columns.length}>
              {visualisation.name}
            </th>
          </tr>
          {data.metadata.categoryColumnTitle &&
            <tr>
              <th className="spacer" />
              <th
                colSpan={data.columns.length - 1}
                className="categoryColumnTitle"
              >
                {data.metadata.categoryColumnTitle}
              </th>
            </tr>
          }
          <tr className="columnHeader">
            {data.columns.map((cell, index) =>
              <th
                key={index}
                className={getColumnHeaderClassname(cell, index, visualisation.spec)}
                title={index === 0 ? cell.title : replaceLabelIfValueEmpty(cell.title)}
              >
                {formatTitle(index === 0 ? cell.title : replaceLabelIfValueEmpty(cell.title))}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) =>
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                <td
                  key={cellIndex}
                  // Only set the title attribute if the index is 0
                  {...cellIndex === 0 ?
                    { title:  replaceLabelIfValueEmpty(cell) } : {}
                  }
                >
                  {cellIndex === 0 ?
                    formatTitle(replaceLabelIfValueEmpty(cell))
                    :
                    formatCell(cellIndex, cell, visualisation.spec, data.columns)
                  }
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
