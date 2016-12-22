import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import SelectMenu from '../../common/SelectMenu';
import SelectInput from './SelectInput';
import LabelInput from './LabelInput';
import FilterMenu from './FilterMenu';
import * as entity from '../../../domain/entity';
import VisualisationTypeMenu from '../VisualisationTypeMenu';


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

const datasetColumnLabelText = 'Metric column';
const datasetColumnPlaceholder = 'Select a metric column';

const labelColumnLabelText = 'Label column';
const labelColumnPlaceholder = 'Choose a name column...';

const groupColumnLabelText = 'Bucket column';
const groupColumnPlaceholder = 'Select a data column to group by';

const subGroupColumnLabelText = 'Sub-bucket column';
const subGroupColumnPlaceholder = 'Select a sub-bucket column';

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
      choice={spec.bucketColumn !== null ?
        spec.bucketColumn.toString() : null}
      name="xGroupColumnMenu"
      options={columnOptions}
      clearable
      onChange={value => onChangeSpec({
        bucketColumn: value,
        bucketColumnType: getColumnType(value, columnOptions),
      })}
    />
  </div>
);

ColumnGroupingInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

const ColumnSubGroupingInput = ({ spec, columnOptions, onChangeSpec, disabled }) => (
  <div
    className="ColumnSubGroupingInput"
  >
    <SelectInput
      placeholder={subGroupColumnPlaceholder}
      labelText={subGroupColumnLabelText}
      choice={spec.subBucketColumn !== null ?
        spec.subBucketColumn.toString() : null}
      name="subGroupColumnMenu"
      options={columnOptions}
      clearable
      disabled={disabled}
      onChange={value => onChangeSpec({
        subBucketColumn: value,
        subBucketColumnType: getColumnType(value, columnOptions),
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
    placeholder={spec.bucketColumn !== null ?
      'Choose aggregation type...' : 'Must choose "Group by" column first'}
    labelText={aggregationColumnLabelText}
    choice={spec.bucketColumn !== null ?
      spec.metricAggregation.toString() : null}
    name="yAggregationMenu"
    options={aggregationOptions}
    disabled={spec.bucketColumn === null}
    onChange={value => onChangeSpec({
      metricAggregation: value,
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
      placeholder="Choose a sort direction..."
      labelText="Sort"
      choice={spec.sort !== null ? spec.sort.toString() : null}
      name="sortInput"
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
      clearable
      onChange={value => onChangeSpec({
        sort: value,
      })}
    />
  </div>
);

SortInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

export default function BarConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;
  const onChangeSpec = props.onChangeVisualisationSpec;
  const spec = visualisation.spec;

  const columns = props.datasets[visualisation.datasetId] ?
    props.datasets[visualisation.datasetId].get('columns') : Immutable.List();
  const columnOptions = getSelectMenuOptionsFromColumnList(columns);

  const getComponents = (visualisationType) => {
    let output;
    switch (visualisationType) {

      case 'bar':
        output = (
          <div>
            <Subtitle>Y-Axis</Subtitle>
            <SelectInput
              placeholder={datasetColumnPlaceholder}
              labelText={datasetColumnLabelText}
              choice={spec.metricColumnY !== null ? spec.metricColumnY.toString() : null}
              name="metricColumnYInput"
              options={columnOptions}
              onChange={value => onChangeSpec({
                metricColumnY: value,
                metricColumnYType: getColumnType(value, columnOptions),
              })}
            />
            <AggregationInput
              spec={spec}
              onChangeSpec={onChangeSpec}
            />
            <LabelInput
              value={spec.axisLabelY !== null ? spec.axisLabelY.toString() : null}
              placeholder="Y Axis label"
              name="yLabel"
              onChange={event => onChangeSpec({
                axisLabelY: event.target.value.toString(),
              })}
            />
            <Subtitle>X-Axis</Subtitle>
            <ColumnGroupingInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
            />
            <SelectInput
              labelText="Sub-bucket method"
              choice={spec.subBucketMethod !== null ? spec.subBucketMethod.toString() : null}
              name="subBucketMethodInput"
              disabled={spec.bucketColumn === null}
              options={[
                {
                  value: 'split',
                  label: 'Split bars',
                },
                {
                  value: 'stack',
                  label: 'Stack bars',
                },
              ]}
              onChange={value => onChangeSpec({
                subBucketMethod: value,
              })}
            />
            <ColumnSubGroupingInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
              disabled={spec.bucketColumn === null}
            />
            <SortInput
              spec={spec}
              columnOptions={columnOptions}
              onChangeSpec={onChangeSpec}
            />
            <LabelInput
              value={spec.axisLabelX !== null ? spec.axisLabelX.toString() : null}
              placeholder="X Axis label"
              name="xLabel"
              onChange={event => onChangeSpec({
                axisLabelX: event.target.value.toString(),
              })}
            />
          </div>
        );
        break;

      default:
        throw new Error(`Invalid visualisation type "${visualisationType}"`);
    }

    return output;
  };

  return (getComponents(visualisation.visualisationType));
}

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

BarConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
};
