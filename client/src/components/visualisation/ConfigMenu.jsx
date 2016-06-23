import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import DashSelect from '../common/DashSelect';
import ColumnMenu from './configMenu/ColumnMenu';
import LabelColumnMenu from './configMenu/LabelColumnMenu';
import LabelInput from './configMenu/LabelInput';
import * as entity from '../../domain/entity';


const sortFunction = (a, b) => {
  const string1 = entity.getTitle(a).toLowerCase();
  const string2 = entity.getTitle(b).toLowerCase();
  return string1.localeCompare(string2);
};

const getDatasetArray = datasetObject =>
  Object.keys(datasetObject)
    .map(id => datasetObject[id])
    .sort(sortFunction);

const getDatasetOptions = datasetArray =>
  datasetArray.map(dataset => ({
    value: entity.getId(dataset),
    label: entity.getTitle(dataset),
  }));

const getDashSelectOptionsFromColumnList = (columns = Immutable.List()) =>
  columns.map((column, index) => ({
    value: index,
    label: column.get('title'),
  })).toArray();

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
    props.datasets[visualisation.datasetId].get('columns') : Immutable.List();
  const columnOptions = getDashSelectOptionsFromColumnList(columns);

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
                labelY: event.target.value,
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
                labelX: event.target.value,
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
                labelY: event.target.value,
              })}
            />
            <Subtitle>X-Axis</Subtitle>
            <LabelInput
              value={spec.labelX !== null ? spec.labelX.toString() : null}
              placeholder="X Axis label"
              name="xLabel"
              onChange={(event) => onChangeSpec({
                labelX: event.target.value,
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
                labelY: event.target.value,
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
                labelX: event.target.value,
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
          value={visualisation.datasetId !== null ?
            visualisation.datasetId.toString() : 'Choose dataset...'}
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
