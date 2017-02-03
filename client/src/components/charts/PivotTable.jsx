import React, { Component, PropTypes } from 'react';
import isEqual from 'lodash/isEqual';
import * as api from '../../api';

require('../../styles/PivotTable.scss');

const specIsValid = (spec) => {
  if (spec.aggregation !== 'count' && spec.valueColumn == null) {
    return false;
  }

  return true;
};

export default class PivotTable extends Component {
  constructor() {
    super();
    this.state = {
      tableData: null,
    };

    this.fetchPivotData = this.fetchPivotData.bind(this);
  }

  componentDidMount() {
    if (!this.props.visualisation.data && this.props.visualisation.datasetId) {
      this.fetchPivotData(this.props.visualisation.datasetId, this.props.visualisation.spec);
    }
  }

  componentWillReceiveProps(newProps) {
    const newSpec = newProps.visualisation.spec;
    const specChanged = !isEqual(this.props.visualisation.spec, newSpec);
    const datasetChanged = this.props.visualisation.datasetId !== newProps.visualisation.datasetId;

    if (!this.props.visualisation.data && (specChanged || datasetChanged)) {
      this.fetchPivotData(newProps.visualisation.datasetId, newSpec);
    }
  }

  fetchPivotData(datasetId, spec) {
    if (specIsValid(spec)) {
      const requestId = Math.random();
      this.latestRequestId = requestId;

      api.get(`/api/pivot/${datasetId}`, {
        query: JSON.stringify(spec),
      }).then((response) => {
        if (requestId === this.latestRequestId) {
          this.setState({ tableData: response });
        }
      });
    }
  }

  render() {
    const { width, height, visualisation } = this.props;
    const data = visualisation.data ? visualisation.data : this.state.tableData;

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
                <th key={index}>{cell.title}</th>
              )}
            </tr>
            {data.rows.map((row, rowIndex) =>
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) =>
                  <td key={cellIndex}>
                    {cell}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

PivotTable.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};
