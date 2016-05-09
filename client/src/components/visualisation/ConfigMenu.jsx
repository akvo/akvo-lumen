import React, { PropTypes } from 'react';
import DashSelect from '../common/DashSelect';
import ColumnMenu from './configMenu/ColumnMenu';
import LabelColumnMenu from './configMenu/LabelColumnMenu';
import LabelInput from './configMenu/LabelInput';


const getDatasetArray = datasetObject => {
  const datasetArray = [];
  const sortFunction = (a, b) => {
    const string1 = a.name.toLowerCase();
    const string2 = b.name.toLowerCase();
    let out = 0;

    if (string1 > string2) {
      out = 1;
    } else if (string1 === string2) {
      out = 0;
    } else {
      out = -1;
    }

    return out;
  };

  Object.keys(datasetObject).forEach(key => {
    datasetArray.push(datasetObject[key]);
  });

  datasetArray.sort(sortFunction);

  return datasetArray;
};

const getDatasetOptions = datasetArray => {
  const output = [];

  datasetArray.forEach(option => {
    output.push({
      value: option.id, label: option.name,
    });
  });

  return output;
};

const getDashSelectOptionsFromColumnArray = array => {
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
  <h3 className="subtitle">{subtitle}</h3>
);

export default function ConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;

  const columns = props.datasets[visualisation.sourceDataset] ?
    props.datasets[visualisation.sourceDataset].columns : [];
  const columnOptions = getDashSelectOptionsFromColumnArray(columns);

  const getComponents = visualisationType => {
    let output;
    switch (visualisationType) {
      case 'bar':
        output = (
          <div>
            {getSubTitle('X-Axis')}
            <ColumnMenu
              choice={visualisation.datasetColumnX}
              name="xColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnX}
            />
            <LabelColumnMenu
              choice={visualisation.datasetNameColumnX}
              name="xNameColumnMenu"
              options={columnOptions}
              onChange={props.onChangeDatasetNameColumnX}
            />
            <LabelInput
              value={visualisation.labelX}
              placeholder="X Axis label"
              name="xLabel"
              onChange={props.onChangeDatasetLabelX}
            />
            {getSubTitle('Y-Axis')}
            <LabelInput
              value={visualisation.labelY}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={props.onChangeDatasetLabelY}
            />
          </div>
        );
        break;

      case 'line':
      case 'area':

        output = (
          <div>
            {getSubTitle('X-Axis')}
            <ColumnMenu
              choice={visualisation.datasetColumnX}
              name="xColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnX}
            />
            <LabelInput
              value={visualisation.labelX}
              placeholder="X Axis label"
              name="xLabel"
              onChange={props.onChangeDatasetLabelX}
            />
            {getSubTitle('Y-Axis')}
            <LabelInput
              value={visualisation.labelY}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={props.onChangeDatasetLabelY}
            />
          </div>
        );
        break;

      case 'scatter':

        output = (
          <div>
            {getSubTitle('X-Axis')}
            <ColumnMenu
              choice={visualisation.datasetColumnX}
              name="xColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnX}
            />
            <LabelInput
              value={visualisation.labelX}
              placeholder="X Axis label"
              name="xLabel"
              onChange={props.onChangeDatasetLabelX}
            />
            {getSubTitle('Y-Axis')}
            <ColumnMenu
              choice={visualisation.datasetColumnY}
              name="yColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnY}
            />
            <LabelInput
              value={visualisation.labelY}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={props.onChangeDatasetLabelY}
            />
          </div>
        );
        break;

      case 'map':

        output = (
          <div>
            {getSubTitle('Latitude')}
            <ColumnMenu
              choice={visualisation.datasetColumnX}
              name="xColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnX}
            />
            {getSubTitle('Longitude')}
            <ColumnMenu
              choice={visualisation.datasetColumnY}
              name="yColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnY}
            />
            {getSubTitle('Popup Label')}
            <LabelColumnMenu
              choice={visualisation.datasetNameColumnX}
              name="xNameColumnMenu"
              options={columnOptions}
              onChange={props.onChangeDatasetNameColumnX}
            />
          </div>
        );
        break;

      case 'pie':
      case 'donut':

        output = (
          <div>
            <ColumnMenu
              choice={visualisation.datasetColumnX}
              name="xColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnX}
            />
            <LabelColumnMenu
              choice={visualisation.datasetNameColumnX}
              name="xNameColumnMenu"
              options={columnOptions}
              onChange={props.onChangeDatasetNameColumnX}
            />
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
          value={visualisation.sourceDataset !== null ?
            visualisation.sourceDataset : 'Choose a dataset option...'}
          options={datasetOptions}
          onChange={props.onChangeSourceDataset}
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
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetColumnY: PropTypes.func,
  onChangeDatasetNameColumnX: PropTypes.func,
  onChangeDatasetLabelX: PropTypes.func,
  onChangeDatasetLabelY: PropTypes.func,
};
