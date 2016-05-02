import React, { PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';

const getDatasetArray = datasetObject => {
  const datasetArray = [];
  const sortFunction = (a, b) => a.name.toLowerCase() > b.name.toLowerCase();

  Object.keys(datasetObject).forEach(key => {
    datasetArray.push(datasetObject[key]);
  });

  datasetArray.sort(sortFunction);

  return datasetArray;
};

const getDatasetOptions = (datasetArray) => {
  const output = [];

  datasetArray.forEach(option => {
    output.push({
      value: option.id, label: option.name,
    });
  });

  return output;
};

const getDashSelectOptionsFromColumnArray = (array) => {
  const output = [];

  if (array) {
    array.forEach((entry, index) => {
      output.push({
        value: index, label: entry.title,
      });
    });
  }
  return output;
};

export default function ConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;

  const xColumns = props.datasets[visualisation.sourceDatasetX] ?
    props.datasets[visualisation.sourceDatasetX].columns : [];
  const columnOptionsX = getDashSelectOptionsFromColumnArray(xColumns);

  let subtitle1;
  let subtitle2;
  let labelColumnXInput;
  let xAxisLabelInput;
  let yAxisLabelInput;
  let yColumnInput;

  switch (visualisation.visualisationType) {
    case 'bar':

      subtitle1 = <h3>X-Axis</h3>;
      subtitle2 = <h3>Y-Axis</h3>;
      labelColumnXInput = (
        <div className="inputGroup">
          <label htmlFor="xNameColumnMenu">Label column:</label>
          <DashSelect
            name="xNameColumnMenu"
            disabled={xColumns ? xColumns.length === 0 : true}
            value={visualisation.datasetNameColumnX !== null ?
              visualisation.datasetNameColumnX : 'Choose a name column...'}
            onChange={props.onChangeDatasetNameColumnX}
            options={columnOptionsX}
          />
        </div>
      );
      xAxisLabelInput = (
        <div className="inputGroup">
          <label htmlFor="xLabel">X Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="X Axis label"
            defaultValue={visualisation.labelX}
            onChange={props.onChangeDatasetLabelX}
          />
        </div>
      );
      yAxisLabelInput = (
        <div className="inputGroup">
          <label htmlFor="yLabel">Y Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="Y Axis label"
            defaultValue={visualisation.labelY}
            onChange={props.onChangeDatasetLabelY}
          />
        </div>
      );
      yColumnInput = null;

      break;

    case 'line':
    case 'area':
      subtitle1 = <h3>X-Axis</h3>;
      subtitle2 = <h3>Y-Axis</h3>;
      labelColumnXInput = null;
      xAxisLabelInput = (
        <div className="inputGroup">
          <label htmlFor="xLabel">X Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="X Axis label"
            defaultValue={visualisation.labelX}
            onChange={props.onChangeDatasetLabelX}
          />
        </div>
      );
      yAxisLabelInput = null;
      yColumnInput = null;

      break;

    case 'scatter':
    case 'map':
      subtitle1 = <h3>X-Axis</h3>;
      subtitle2 = <h3>Y-Axis</h3>;
      labelColumnXInput = null;
      xAxisLabelInput = (
        <div className="inputGroup">
          <label htmlFor="xLabel">X Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="X Axis label"
            defaultValue={visualisation.labelX}
            onChange={props.onChangeDatasetLabelX}
          />
        </div>
      );
      yAxisLabelInput = (
        <div className="inputGroup">
          <label htmlFor="yLabel">Y Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="Y Axis label"
            defaultValue={visualisation.labelY}
            onChange={props.onChangeDatasetLabelY}
          />
        </div>
      );
      yColumnInput = (
        <div className="inputGroup">
          <label htmlFor="yColumnMenu">Dataset column:</label>
          <DashSelect
            name="yColumnMenu"
            value={visualisation.datasetColumnY !== null ?
              visualisation.datasetColumnY : 'Choose a dataset column...'}
            options={columnOptionsX}
            onChange={props.onChangeDatasetColumnY}
          />
        </div>
      );

      break;

    case 'pie':
    case 'donut':

      subtitle1 = null;
      subtitle2 = null;
      labelColumnXInput = (
        <div className="inputGroup">
          <label htmlFor="xNameColumnMenu">Label column:</label>
          <DashSelect
            name="xNameColumnMenu"
            disabled={xColumns ? xColumns.length === 0 : true}
            value={visualisation.datasetNameColumnX !== null ?
              visualisation.datasetNameColumnX : 'Choose a name column...'}
            onChange={props.onChangeDatasetNameColumnX}
            options={columnOptionsX}
          />
        </div>
      );
      xAxisLabelInput = null;
      yAxisLabelInput = null;
      yColumnInput = null;

      break;

    default:
      throw new Error('Invalid visualisation type');
  }

  return (
    <div className="ConfigMenu">
      <div className="inputGroup">
        <label htmlFor="xDatasetMenu">Source dataset:</label>
        <DashSelect
          name="xDatasetMenu"
          value={visualisation.sourceDatasetX !== null ?
            visualisation.sourceDatasetX : 'Choose a dataset option...'}
          options={datasetOptions}
          onChange={props.onChangeSourceDatasetX}
        />
      </div>
      <div className="inputGroup">
        <label htmlFor="chartTitle">Chart title:</label>
        <input
          className="textInput"
          type="text"
          id="chartTitle"
          placeholder="Untitled chart"
          defaultValue={visualisation.name}
          onChange={props.onChangeTitle}
        />
      </div>
      {subtitle1}
      <div className="inputGroup">
        <label htmlFor="xColumnMenu">Dataset column:</label>
        <DashSelect
          name="xColumnMenu"
          value={visualisation.datasetColumnX !== null ?
            visualisation.datasetColumnX : 'Choose a dataset column...'}
          options={columnOptionsX}
          onChange={props.onChangeDatasetColumnX}
        />
      </div>
      {labelColumnXInput}
      {xAxisLabelInput}

      {subtitle2}
      {yColumnInput}
      {yAxisLabelInput}
    </div>
  );
}

ConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeSourceDatasetX: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetColumnY: PropTypes.func,
  onChangeDatasetNameColumnX: PropTypes.func,
  onChangeDatasetLabelX: PropTypes.func,
  onChangeDatasetLabelY: PropTypes.func,
};
