import React, { PropTypes } from 'react';
import DashSelect from '../common/DashSelect';
import ColumnMenu from './configMenu/ColumnMenu';
import LabelColumnMenu from './configMenu/LabelColumnMenu';
import LabelInput from './configMenu/LabelInput';

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

const getDatasetArray = datasetObject => {
  const datasetArray = [];

  Object.keys(datasetObject).forEach(key => {
    datasetArray.push(datasetObject[key]);
  });

  datasetArray.sort(sortFunction);

  return datasetArray;
};

const getDatasetOptions = datasetArray =>
  datasetArray.map(option => ({
    value: option.id,
    label: option.name,
  }));

const getDashSelectOptionsFromColumnArray = (array = []) =>
  array.map((entry, index) => ({
    value: index,
    label: entry.title,
  }));

const Subtitle = ({ children }) => (
  <h3 className="subtitle">{children}</h3>
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
            <Subtitle>X-Axis</Subtitle>
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
            <Subtitle>Y-Axis</Subtitle>
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
            <Subtitle>X-Axis</Subtitle>
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
            <Subtitle>Y-Axis</Subtitle>
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
            <Subtitle>X-Axis</Subtitle>
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
            <Subtitle>Y-Axis</Subtitle>
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
            <Subtitle>Latitude</Subtitle>
            <ColumnMenu
              choice={visualisation.datasetColumnY}
              name="yColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnY}
            />
            <Subtitle>Longitude</Subtitle>
            <ColumnMenu
              choice={visualisation.datasetColumnX}
              name="xColumnInput"
              options={columnOptions}
              onChange={props.onChangeDatasetColumnX}
            />
            <Subtitle>Popup Label</Subtitle>
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

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

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
