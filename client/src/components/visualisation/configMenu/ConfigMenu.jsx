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

const getSubTitle = subtitle => (
  <h3>{subtitle}</h3>
);

const getColumnMenu = (choice, name, options, onchange) => (
  <div className="inputGroup">
    <label htmlFor={name}>
      Dataset column:
    </label>
    <DashSelect
      name={name}
      value={choice !== null ?
        choice : 'Choose a dataset column...'}
      options={options}
      onChange={onchange}
    />
  </div>
);

const getLabelColumnMenu = (choice, name, options, onchange) => (
  <div className="inputGroup">
    <label htmlFor={name}>Label column:</label>
    <DashSelect
      name={name}
      disabled={options ? options.length === 0 : true}
      value={choice !== null ?
        choice : 'Choose a name column...'}
      onChange={onchange}
      options={options}
    />
  </div>
);

const getLabelInput = (value, placeholder, name, onchange) => (
  <div className="inputGroup">
    <label htmlFor={name}>X Axis Label:</label>
    <input
      className="textInput"
      name={name}
      type="text"
      placeholder={placeholder}
      defaultValue={value}
      onChange={onchange}
    />
  </div>
);

export default function ConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;

  const xColumns = props.datasets[visualisation.sourceDatasetX] ?
    props.datasets[visualisation.sourceDatasetX].columns : [];
  const columnOptionsX = getDashSelectOptionsFromColumnArray(xColumns);

  const getComponents = visualisationType => {
    let output;
    switch (visualisationType) {
      case 'bar':
        output = (
          <div>
            {getSubTitle('X-Axis')}
            {getColumnMenu(visualisation.datasetColumnX, 'xColumnInput',
              columnOptionsX, props.onChangeDatasetColumnX)}
            {getLabelColumnMenu(visualisation.datasetNameColumnX, 'xNameColumnMenu',
              columnOptionsX, props.onChangeDatasetNameColumnX)}
            {getLabelInput(visualisation.labelX, 'X Axis label', 'xLabel',
            props.onChangeDatasetLabelX)}
            {getSubTitle('Y-Axis')}
            {getLabelInput(visualisation.labelY, 'Y Axis label', 'yLabel',
              props.onChangeDatasetLabelY)}
          </div>
        );
        break;

      case 'line':
      case 'area':

        output = (
          <div>
            {getSubTitle('X-Axis')}
            {getColumnMenu(visualisation.datasetColumnX, 'xColumnInput',
              columnOptionsX, props.onChangeDatasetColumnX)}
            {getLabelInput(visualisation.labelX, 'X Axis label', 'xLabel',
              props.onChangeDatasetLabelX)}
            {getSubTitle('Y-Axis')}
            {getLabelInput(visualisation.labelY, 'Y Axis label', 'yLabel',
              props.onChangeDatasetLabelY)}
          </div>
        );
        break;

      case 'scatter':

        output = (
          <div>
            {getSubTitle('X-Axis')}
            {getColumnMenu(visualisation.datasetColumnX, 'xColumnInput',
              columnOptionsX, props.onChangeDatasetColumnX)}
            {getLabelInput(visualisation.labelX, 'X Axis label', 'xLabel',
              props.onChangeDatasetLabelX)}
            {getSubTitle('Y-Axis')}
            {getColumnMenu(visualisation.datasetColumnY, 'yColumnInput',
              columnOptionsX, props.onChangeDatasetColumnY)}
            {getLabelInput(visualisation.labelY, 'Y Axis label', 'yLabel',
              props.onChangeDatasetLabelY)}
          </div>
        );
        break;

      case 'map':

        output = (
          <div>
            {getSubTitle('Latitude')}
            {getColumnMenu(visualisation.datasetColumnX, 'xColumnInput',
              columnOptionsX, props.onChangeDatasetColumnX)}
            {getSubTitle('Longitude')}
            {getColumnMenu(visualisation.datasetColumnY, 'yColumnInput',
              columnOptionsX, props.onChangeDatasetColumnY)}
            {getSubTitle('Popup Label')}
            {getLabelColumnMenu(visualisation.datasetNameColumnX, 'xNameColumnMenu',
              columnOptionsX, props.onChangeDatasetNameColumnX)}
          </div>
        );
        break;

      case 'pie':
      case 'donut':

        output = (
          <div>
            {getColumnMenu(visualisation.datasetColumnX, 'xColumnInput',
              columnOptionsX, props.onChangeDatasetColumnX)}
            {getLabelColumnMenu(visualisation.datasetNameColumnX, 'xNameColumnMenu',
              columnOptionsX, props.onChangeDatasetNameColumnX)}
          </div>
        );
        break;

      default:
        throw new Error('Invalid visualisation type');
    }

    return output;
  };

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
      {getComponents(visualisation.visualisationType)}
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
