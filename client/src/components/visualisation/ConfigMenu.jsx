import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import SelectMenu from '../common/SelectMenu';
import ColumnMenu from './configMenu/ColumnMenu';
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

const getSelectMenuOptionsFromColumnList = (columns = Immutable.List()) =>
  columns.map((column, index) => ({
    value: index.toString(),
    label: column.get('title'),
  })).toArray();

const Subtitle = ({ children }) => (
  <h3 className="subtitle">{children}</h3>
);

const datasetColumnLabelText = 'Dataset column';
const datasetColumnPlaceholder = 'Choose a dataset column...';

const labelColumnLabelText = 'Label column';
const labelColumnPlaceholder = 'Choose a name column...';

const groupColumnLabelText = 'Group by column';
const groupColumnPlaceholder = 'Choose a column to group by...';

const aggregationOptions = [
  {
    value: 'mean',
    label: 'mean',
  },
  {
    value: 'median',
    label: 'median',
  },
  {
    value: 'max',
    label: 'max',
  },
  {
    value: 'min',
    label: 'min',
  },
  {
    value: 'count',
    label: 'count',
  },
  {
    value: 'distinct',
    label: 'count unique',
  },
  {
    value: 'sum',
    label: 'sum',
  },
  {
    value: 'q1',
    label: 'lower quartile',
  },
  {
    value: 'q3',
    label: 'upper quartile',
  },
];

export default function ConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;
  const onChangeSpec = props.onChangeVisualisationSpec;
  const spec = visualisation.spec;

  const columns = props.datasets[visualisation.datasetId] ?
    props.datasets[visualisation.datasetId].get('columns') : Immutable.List();
  const columnOptions = getSelectMenuOptionsFromColumnList(columns);

  const getComponents = visualisationType => {
    let output;
    switch (visualisationType) {

      case 'bar':
        output = (
          <div>
            <Subtitle>Y-Axis</Subtitle>
            <ColumnMenu
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
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
            {spec.datasetGroupColumnX !== null &&
              <ColumnMenu
                placeholder="Choose aggregation type..."
                labelText="Aggregation type"
                choice={spec.aggregationTypeY !== null ? spec.aggregationTypeY.toString() : null}
                name="yAggregationMenu"
                options={aggregationOptions}
                onChange={(value) => onChangeSpec({
                  aggregationTypeY: value,
                })}
              />
            }
            <Subtitle>X-Axis</Subtitle>
            {spec.datasetGroupColumnX === null &&
              <ColumnMenu
                placeholder={labelColumnPlaceholder}
                labelText={labelColumnLabelText}
                choice={spec.datasetNameColumnX !== null ?
                  spec.datasetNameColumnX.toString() : null}
                name="xNameColumnMenu"
                options={columnOptions}
                clearable
                onChange={(value) => onChangeSpec({
                  datasetNameColumnX: value,
                })}
              />
            }
            <LabelInput
              value={spec.labelX !== null ? spec.labelX.toString() : null}
              placeholder="X Axis label"
              name="xLabel"
              onChange={(event) => onChangeSpec({
                labelX: event.target.value.toString(),
              })}
            />
            <ColumnMenu
              placeholder={groupColumnPlaceholder}
              labelText={groupColumnLabelText}
              choice={spec.datasetGroupColumnX !== null ?
                spec.datasetGroupColumnX.toString() : null}
              name="xGroupColumnMenu"
              options={columnOptions}
              clearable
              onChange={(value) => onChangeSpec({
                datasetGroupColumnX: value,
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
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
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
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
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
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
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
            <Subtitle>Popup Label</Subtitle>
            <ColumnMenu
              placeholder={labelColumnPlaceholder}
              labelText={labelColumnLabelText}
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              clearable
              onChange={(value) => onChangeSpec({
                datasetNameColumnX: value,
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
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnY !== null ? spec.datasetColumnY.toString() : null}
              name="yColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnY: value,
              })}
            />
            <Subtitle>Longitude</Subtitle>
            <ColumnMenu
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <Subtitle>Popup Label</Subtitle>
            <ColumnMenu
              placeholder={labelColumnPlaceholder}
              labelText={labelColumnLabelText}
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              clearable
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
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
              })}
            />
            <ColumnMenu
              placeholder={labelColumnPlaceholder}
              labelText={labelColumnLabelText}
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              clearable
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
        <SelectMenu
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
