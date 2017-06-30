import React from 'react';
import PropTypes from 'prop-types';
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
import PivotTableConfigMenu from './configMenu/PivotTableConfigMenu';
import visualisationTypes from '../../containers/Visualisation/visualisationTypes';

require('./ConfigMenu.scss');

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
    value: `${column.get('columnName')}`,
    index: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} (${column.get('type')})`,
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

  const getChartTypeEditor = (visualisationType) => {
    let chartTypeEditor;

    switch (visualisationType) {
      case 'bar':
        chartTypeEditor = (<BarConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
        />);
        break;

      case 'line':
      case 'area':
        chartTypeEditor = (<LineConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
        />);
        break;

      case 'scatter':
        chartTypeEditor = (<ScatterConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
        />);
        break;

      case 'map':
        chartTypeEditor = (<MapConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          aggregationOptions={aggregationOptions}
        />);
        break;

      case 'pie':
      case 'donut':
        chartTypeEditor = (<PieConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
        />);
        break;

      case 'pivot table':
        chartTypeEditor = (<PivotTableConfigMenu
          visualisation={props.visualisation}
          onChangeSpec={props.onChangeVisualisationSpec}
          datasets={props.datasets}
          columnOptions={columnOptions}
          aggregationOptions={aggregationOptions}
        />);
        break;

      default:
        throw new Error(`Invalid visualisation type "${visualisationType}"`);
    }
    return chartTypeEditor;
  };

  return (
    <div className="ConfigMenu">
      {
        visualisation.visualisationType == null ?
          <div className="visualisationTypePicker">
            <ul>
              {visualisationTypes.map((vType, index) =>
                <li
                  className={`clickable typeButton ${vType.replace(/ /, '')}`}
                  key={index}
                  onClick={() => props.onChangeVisualisationType(vType)}
                >
                  {vType}
                </li>
              )}
            </ul>
          </div>
        :
          <div>
            {visualisation.visualisationType === 'map' ?
              <MapConfigMenu
                visualisation={props.visualisation}
                onChangeSpec={props.onChangeVisualisationSpec}
                onChangeVisualisationType={props.onChangeVisualisationType}
                datasets={props.datasets}
                datasetOptions={getDatasetOptions(getDatasetArray(props.datasets))}
                columnOptions={columnOptions}
                aggregationOptions={aggregationOptions}
                onSave={props.onSaveVisualisation}
                onChangeSourceDataset={props.onChangeSourceDataset}
              />
            :
              <div>
                <VisualisationTypeMenu
                  onChangeVisualisationType={props.onChangeVisualisationType}
                  visualisation={visualisation}
                  disabled={visualisation.datasetId === null}
                />
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
                  filters={spec.filters}
                  columnOptions={columnOptions}
                />
                {(visualisation.datasetId && visualisation.visualisationType) &&
                getChartTypeEditor(visualisation.visualisationType)
              }
                <button
                  className="saveChanges clickable"
                  onClick={props.onSaveVisualisation}
                >
                Save
              </button>
              </div>
          }
          </div>
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
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};
