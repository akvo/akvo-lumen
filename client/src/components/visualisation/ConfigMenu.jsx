import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import SelectMenu from '../common/SelectMenu';
import SelectInput from './configMenu/SelectInput';
import LabelInput from './configMenu/LabelInput';
import FilterMenu from './configMenu/FilterMenu';
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
    title: `${column.get('title')}`,
    label: `${column.get('title')} [${column.get('type')}]`,
    type: `${column.get('type')}`,
  })).toArray();

const getColumnType = (index, options) => {
  let columnType = null;

  if (index !== null) {
    columnType = options.find(option => option.value === index).type;
  }

  return columnType;
};

const Subtitle = ({ children }) => (
  <h3 className="subtitle">{children}</h3>
);

const datasetColumnLabelText = 'Dataset column';
const datasetColumnPlaceholder = 'Choose a dataset column...';

const labelColumnLabelText = 'Label column';
const labelColumnPlaceholder = 'Choose a name column...';

const groupColumnLabelText = 'Group by column';
const groupColumnPlaceholder = 'Choose a column to group by...';

const aggregationColumnLabelText = 'Aggregation type';

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

const ColumnGroupingInput = ({ spec, columnOptions, onChangeSpec }) => (
  <div
    className="ColumnGroupingInput"
  >
    <SelectInput
      placeholder={groupColumnPlaceholder}
      labelText={groupColumnLabelText}
      choice={spec.datasetGroupColumnX !== null ?
        spec.datasetGroupColumnX.toString() : null}
      name="xGroupColumnMenu"
      options={columnOptions}
      clearable
      onChange={(value) => onChangeSpec({
        datasetGroupColumnX: value,
        datasetGroupColumnXType: getColumnType(value, columnOptions),
      })}
    />
    <div
      className="inputSeperator"
    >
      - or -
    </div>
    <SelectInput
      placeholder={labelColumnPlaceholder}
      labelText={labelColumnLabelText}
      choice={(spec.datasetNameColumnX !== null && spec.datasetGroupColumnX == null) ?
        spec.datasetNameColumnX.toString() : null}
      name="xNameColumnMenu"
      options={columnOptions}
      disabled={spec.datasetGroupColumnX !== null}
      clearable
      onChange={(value) => onChangeSpec({
        datasetNameColumnX: value,
        datasetNameColumnXType: getColumnType(value, columnOptions),
      })}
    />
  </div>
);

ColumnGroupingInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

const AggregationInput = ({ spec, onChangeSpec }) => (
  <SelectInput
    placeholder={spec.datasetGroupColumnX !== null ?
      'Choose aggregation type...' : 'Must choose "Group by" column first'}
    labelText={aggregationColumnLabelText}
    choice={spec.datasetGroupColumnX !== null ?
      spec.aggregationTypeY.toString() : null}
    name="yAggregationMenu"
    options={aggregationOptions}
    disabled={spec.datasetGroupColumnX === null}
    onChange={(value) => onChangeSpec({
      aggregationTypeY: value,
    })}
  />
);

AggregationInput.propTypes = {
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

const SortInput = ({ spec, columnOptions, onChangeSpec }) => (
  <div>
    <SelectInput
      placeholder="Choose a column to sort by..."
      labelText="Sort column"
      choice={spec.datasetSortColumnX !== null ? spec.datasetSortColumnX.toString() : null}
      name="xSortColumnInput"
      options={columnOptions}
      clearable
      onChange={(value) => onChangeSpec({
        datasetSortColumnX: value,
        datasetSortColumnXType: getColumnType(value, columnOptions),
      })}
    />
    <SelectInput
      placeholder="Sort direction..."
      labelText="Sort direction"
      choice={spec.reverseSortX ? 'dsc' : 'asc'}
      disabled={!spec.datasetSortColumnX}
      name="xSortColumnInput"
      options={[
        {
          value: 'asc',
          label: 'Ascending',
        },
        {
          value: 'dsc',
          label: 'Descending',
        },
      ]}
      onChange={(value) => onChangeSpec({
        reverseSortX: value === 'dsc',
      })}
    />
  </div>
);

SortInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

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
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
                datasetColumnXType: getColumnType(value, columnOptions),
              })}
            />
            <AggregationInput
              spec={spec}
              onChangeSpec={onChangeSpec}
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
            <ColumnGroupingInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
            />
            <SortInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
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
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
                datasetColumnXType: getColumnType(value, columnOptions),
              })}
            />
            <AggregationInput
              spec={spec}
              onChangeSpec={onChangeSpec}
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
            <SelectInput
              placeholder={groupColumnPlaceholder}
              labelText={groupColumnLabelText}
              choice={spec.datasetGroupColumnX !== null ?
                spec.datasetGroupColumnX.toString() : null}
              name="xGroupColumnMenu"
              options={columnOptions}
              clearable
              onChange={(value) => onChangeSpec({
                datasetGroupColumnX: value,
                datasetGroupColumnXType: getColumnType(value, columnOptions),
              })}
            />
            <SortInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
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

      case 'scatter':
        output = (
          <div>
            <Subtitle>Y-Axis</Subtitle>
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnY !== null ? spec.datasetColumnY.toString() : null}
              name="yColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnY: value,
                datasetColumnYType: getColumnType(value, columnOptions),
              })}
            />
            <AggregationInput
              spec={spec}
              onChangeSpec={onChangeSpec}
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
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
                datasetColumnXType: getColumnType(value, columnOptions),
              })}
            />
            <ColumnGroupingInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
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
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnY !== null ? spec.datasetColumnY.toString() : null}
              name="yColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnY: value,
                datasetColumnYType: getColumnType(value, columnOptions),
              })}
            />
            <Subtitle>Longitude</Subtitle>
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
                datasetColumnXType: getColumnType(value, columnOptions),
              })}
            />
            <Subtitle>Popup Label</Subtitle>
            <SelectInput
              placeholder={labelColumnPlaceholder}
              labelText={labelColumnLabelText}
              choice={spec.datasetNameColumnX !== null ? spec.datasetNameColumnX.toString() : null}
              name="xNameColumnMenu"
              options={columnOptions}
              clearable
              onChange={(value) => onChangeSpec({
                datasetNameColumnX: value,
                datasetNameColumnXType: getColumnType(value, columnOptions),
              })}
            />
          </div>
        );
        break;

      case 'pie':
      case 'donut':
        output = (
          <div>
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.datasetColumnX !== null ? spec.datasetColumnX.toString() : null}
              name="xColumnInput"
              options={columnOptions}
              onChange={(value) => onChangeSpec({
                datasetColumnX: value,
                datasetColumnXType: getColumnType(value, columnOptions),
              })}
            />
            <AggregationInput
              spec={spec}
              onChangeSpec={onChangeSpec}
            />
            <ColumnGroupingInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
            />
            <SortInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
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
      <FilterMenu
        hasDataset={Boolean(visualisation.datasetId !== null)}
        onChangeSpec={onChangeSpec}
        spec={spec}
        columnOptions={columnOptions}
      />
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
