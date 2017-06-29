import React from 'react';
import PropTypes from 'prop-types';
import { replaceLabelIfValueEmpty, processPivotData } from '../../utilities/chart';
import * as pt from '../../utilities/pivotTable';

require('./PivotTable.scss');

export default function PivotTable({ width, height, visualisation, context }) {
  const { spec } = visualisation;
  const data = processPivotData(visualisation.data, spec);
  const tooManyColumns = data && data.columns && data.columns.length >= pt.columnLimit;
  let totalsClass = data && data.metadata &&
    data.metadata.hasRowTotals && data.metadata.hasColumnTotals ?
    'hasTotals' : '';
  if (spec.hideRowTotals) {
    totalsClass = `${totalsClass} hideRowTotals`;
  }
  if (spec.hideColumnTotals) {
    totalsClass = `${totalsClass} hideColumnTotals`;
  }

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

  if (tooManyColumns) {
    return (
      <div
        className="PivotTable dashChart"
        style={{
          width,
          height,
        }}
      >
        <p>
          There are {data.columns.length} columns in this table, which is too many to display.
          {context === 'editor' &&
            <span>
              {' '}Please choose a different column, or use a dataset filter to reduce the number of unique values.
            </span>
          }
        </p>
      </div>
    );
  }

  return (
    <div
      className={`PivotTable dashChart ${totalsClass}`}
      style={{
        width,
        height,
      }}
    >
      <table>
        <thead>
          <tr className="title">
            <th colSpan={data.columns.length}>
              <span>
                {visualisation.name}
              </span>
            </th>
          </tr>
          {data.metadata.categoryColumnTitle &&
            <tr>
              <th className="spacer" />
              <th
                colSpan={data.columns.length - 1}
                className="categoryColumnTitle"
              >
                <span>
                  {spec.categoryTitle ?
                    spec.categoryTitle : data.metadata.categoryColumnTitle}
                </span>
              </th>
            </tr>
          }
          <tr className="columnHeader">
            {data.columns.map((cell, index) =>
              <th
                key={index}
                className={pt.getColumnHeaderClassname(cell, index, visualisation.spec)}
                title={index === 0 ? cell.title : replaceLabelIfValueEmpty(cell.title)}
                style={{
                  minWidth: index === 0 ?
                    pt.getMinRowTitleWidth(pt.getColumnHeaderBody(cell, index, spec))
                    :
                    pt.getMinCategoryTitleWidth(pt.getColumnHeaderBody(cell, index, spec))
                    ,
                }}
              >
                <span>
                  {pt.getColumnHeaderBody(cell, index, spec)}
                </span>
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
                  className={cellIndex === 0 ? 'uniqueRowValue' : 'cell'}
                  // Only set the title  attribute if the index is 0
                  {...cellIndex === 0 ?
                    {
                      title: replaceLabelIfValueEmpty(cell),
                    } : {}
                  }
                >
                  <span>
                    {cellIndex === 0 ?
                      <span
                        style={{
                          minWidth: pt.getMinRowTitleWidth(cell ? cell.toString() : ''),
                        }}
                      >
                        {pt.formatTitle(replaceLabelIfValueEmpty(cell))}
                      </span>
                      :
                      pt.formatCell(cellIndex, cell, visualisation.spec, data.columns)
                    }
                  </span>
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
  context: PropTypes.string,
};
