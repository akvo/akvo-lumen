import React, { PropTypes } from 'react';
import Immutable from 'immutable';
import SelectMenu from '../common/SelectMenu';
import FilterMenu from './configMenu/FilterMenu';
import Subtitle from './configMenu/Subtitle';
import * as entity from '../../domain/entity';
import VisualisationTypeMenu from './VisualisationTypeMenu';
import BarConfigMenu from './configMenu/BarConfigMenu';
import LineConfigMenu from './configMenu/LineConfigMenu';
import PieConfigMenu from './configMenu/PieConfigMenu';
import ScatterConfigMenu from './configMenu/ScatterConfigMenu';
import MapConfigMenu from './configMenu/MapConfigMenu';


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

  const getColumnMetadata = (metadataName, index, options) => {
    let metadata = null;

    if (index !== null) {
      metadata = options.find(option => option.value === index)[metadataName];
    }

    return metadata;
  };

  const getComponents = (visualisationType) => {
    let output;
    switch (visualisationType) {

      case 'bar':
        output = (<BarConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
          getColumnMetadata={getColumnMetadata}
        />);
        break;

      case 'line':
      case 'area':
        output = (<LineConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
          getColumnMetadata={getColumnMetadata}
        />);
        break;

      case 'scatter':
        output = (<ScatterConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
          getColumnMetadata={getColumnMetadata}
        />);
        break;

      case 'map':
        output = (<MapConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
          getColumnMetadata={getColumnMetadata}
        />);
        break;

      case 'pie':
      case 'donut':
        output = (<PieConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
          getColumnMetadata={getColumnMetadata}
        />);
        break;

      default:
        throw new Error(`Invalid visualisation type "${visualisationType}"`);
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
      <VisualisationTypeMenu
        onChangeVisualisationType={props.onChangeVisualisationType}
        visualisation={visualisation}
      />
      {visualisation.visualisationType !== null &&
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
      }
      {(visualisation.datasetId && visualisation.visualisationType) &&
        getComponents(visualisation.visualisationType)
      }
      <button
        className="saveChanges clickable"
        onClick={props.onSaveVisualisation}
      >
        Save changes
      </button>
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
  onChangeVisualisationType: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};
