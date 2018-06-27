import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
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
    labelId: 'mean',
  },
  {
    value: 'median',
    labelId: 'median',
  },
  {
    value: 'max',
    labelId: 'max',
  },
  {
    value: 'min',
    labelId: 'min',
  },
  {
    value: 'count',
    labelId: 'count',
  },
  {
    value: 'distinct',
    labelId: 'count_unique',
  },
  {
    value: 'sum',
    labelId: 'sum',
  },
  {
    value: 'q1',
    labelId: 'lower_quartile',
  },
  {
    value: 'q3',
    labelId: 'upper_quartile',
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
                  data-test-id={`button-${vType.replace(' ', '-')}`}
                  className={`clickable typeButton ${vType.replace(' ', '')}`}
                  key={index}
                  onClick={() => props.onChangeVisualisationType(vType)}
                >
                  <FormattedMessage id={vType} />
                </li>
              )}
            </ul>
          </div>
        :
          <div>
            {visualisation.visualisationType === 'map' ?
              <MapConfigMenu
                visualisation={props.visualisation}
                metadata={props.metadata}
                onChangeSpec={props.onChangeVisualisationSpec}
                onChangeVisualisationType={props.onChangeVisualisationType}
                datasets={props.datasets}
                rasters={props.rasters}
                datasetOptions={getDatasetOptions(getDatasetArray(props.datasets))}
                columnOptions={columnOptions}
                aggregationOptions={aggregationOptions}
                onSave={props.onSaveVisualisation}
                onChangeSourceDataset={props.onChangeSourceDataset}
                loadDataset={props.loadDataset}
              />
            :
              <div>
                <VisualisationTypeMenu
                  onChangeVisualisationType={props.onChangeVisualisationType}
                  visualisation={visualisation}
                  disabled={visualisation.datasetId === null}
                />
                <div
                  className="inputGroup"
                  data-test-id="input-group"
                >
                  <label htmlFor="xDatasetMenu">
                    <FormattedMessage id="source_dataset" />:
                  </label>
                  <div data-test-id="dataset-menu">
                    <SelectMenu
                      name="xDatasetMenu"
                      placeholderId="choose_dataset"
                      value={visualisation.datasetId !== null ?
                      visualisation.datasetId.toString() : null}
                      options={datasetOptions}
                      onChange={props.onChangeSourceDataset}
                    />
                  </div>
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
  metadata: PropTypes.object,
  datasets: PropTypes.object.isRequired,
  rasters: PropTypes.object.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
  loadDataset: PropTypes.func.isRequired,
};
