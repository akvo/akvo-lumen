import React, { PropTypes } from 'react';
import DashSelect from '../common/DashSelect';
import ColumnMenu from './configMenu/ColumnMenu';
import LabelColumnMenu from './configMenu/LabelColumnMenu';
import LabelInput from './configMenu/LabelInput';

const sortFunction = (a, b) => {
  const string1 = a.name.toLowerCase();
  const string2 = b.name.toLowerCase();
  let out;

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
    value: option.id.toString(),
    label: option.name,
  }));

const getDashSelectOptionsFromColumnArray = (array = []) =>
  array.map((entry, index) => ({
    value: index.toString(),
    label: entry.title,
  }));

const Subtitle = ({ children }) => (
  <h3 className="subtitle">{children}</h3>
);

export default function ConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;
  const onChangeSpec = props.onChangeVisualisationSpec;
  const spec = visualisation.spec;

  const columns = props.datasets[visualisation.datasetId] ?
    props.datasets[visualisation.datasetId].columns : [];
  const columnOptions = getDashSelectOptionsFromColumnArray(columns);

  const getComponents = visualisationType => {
    let output;
    switch (visualisationType) {

      case 'bar':
        output = (
          <div>
            <Subtitle>Y-Axis</Subtitle>
            <ColumnMenu
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <LabelInput
              value={spec.labelY !== null ? spec.labelY.toString() : null}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={(event) => onChangeSpec({
                labelY: event.target.value.toString(),
              })}
            />
            <Subtitle>X-Axis</Subtitle>
            <LabelColumnMenu
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetNameColumnX: value,
              })}
            />
            <LabelInput
              value={spec.labelX !== null ? spec.labelX.toString() : null}
              placeholder="X Axis label"
              name="xLabel"
              onChange={(event) => onChangeSpec({
                labelX: event.target.value.toString(),
              })}
            />
          </div>
        );
        break;

      case 'line':
      case 'area':
        output = (
          <div>
            <Subtitle>Y-Axis</Subtitle>
            <ColumnMenu
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <LabelInput
              value={spec.labelY !== null ? spec.labelY.toString() : null}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={(event) => onChangeSpec({
                labelY: event.target.value.toString(),
              })}
            />
            <Subtitle>X-Axis</Subtitle>
            <LabelInput
              value={spec.labelX !== null ? spec.labelX.toString() : null}
              placeholder="X Axis label"
              name="xLabel"
              onChange={(event) => onChangeSpec({
                labelX: event.target.value.toString(),
              })}
            />
          </div>
        );
        break;

      case 'scatter':
        output = (
          <div>
            <Subtitle>Y-Axis</Subtitle>
            <ColumnMenu
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <LabelInput
              value={spec.labelY !== null ? spec.labelY.toString() : null}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={(event) => onChangeSpec({
                labelY: event.target.value.toString(),
              })}
            />
            <Subtitle>X-Axis</Subtitle>
            <ColumnMenu
              choice={spec.datasetColumnY !== null ? spec.datasetColumnY.toString() : null}
              name="yColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnY: value,
              })}
            />
            <LabelInput
              value={spec.labelX !== null ? spec.labelX.toString() : null}
              placeholder="X Axis label"
              name="xLabel"
              onChange={(event) => onChangeSpec({
                labelX: event.target.value.toString(),
              })}
            />
          </div>
        );
        break;

      case 'map':
        output = (
          <div>
            <Subtitle>Latitude</Subtitle>
            <ColumnMenu
              choice={spec.datasetColumnY !== null ? spec.datasetColumnY.toString() : null}
              name="yColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnY: value,
              })}
            />
            <Subtitle>Longitude</Subtitle>
            <ColumnMenu
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <Subtitle>Popup Label</Subtitle>
            <LabelColumnMenu
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetNameColumnX: value,
              })}
            />
          </div>
        );
        break;

      case 'pie':
      case 'donut':
        output = (
          <div>
            <ColumnMenu
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <LabelColumnMenu
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetNameColumnX: value,
              })}
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
          placeholder="Choose dataset..."
          value={visualisation.datasetId !== null ?
            visualisation.datasetId.toString() : null}
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
          defaultValue={visualisation.name !== null ? visualisation.name.toString() : null}
          onChange={props.onChangeTitle}
        />
      </div>
      {visualisation.datasetId &&
        getComponents(visualisation.visualisationType)
      }
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
  onChangeVisualisationSpec: PropTypes.func.isRequired,
};
