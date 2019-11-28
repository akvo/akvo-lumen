import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { intlShape, injectIntl } from 'react-intl';
import FilterMenu from './FilterMenu';
import Subtitle from './Subtitle';
import * as entity from '../../../domain/entity';
import VisualisationTypeMenu from './VisualisationTypeMenu';
import BarConfigMenu from './BarConfigMenu';
import LineConfigMenu from './LineConfigMenu';
import PieConfigMenu from './PieConfigMenu';
import ScatterConfigMenu from './ScatterConfigMenu';
import MapConfigMenu from './MapConfigMenu';
import PivotTableConfigMenu from './PivotTableConfigMenu';
import BubbleConfigMenu from './BubbleConfigMenu';
import DatasetMenu from './DatasetMenu';

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

const getSelectMenuOptionsFromColumnList = (columns = Immutable.List(), intl) =>
  columns.map((column, index) => ({
    value: `${column.get('columnName')}`,
    groupName: `${column.get('groupName')}`,
    columnName: `${column.get('columnName')}`,
    index: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} (${intl.formatMessage({ id: column.get('type') }).toLowerCase()})`,
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

const visualisationTypeComponents = {
  bar: BarConfigMenu,
  line: LineConfigMenu,
  area: LineConfigMenu,
  scatter: ScatterConfigMenu,
  map: MapConfigMenu,
  pie: PieConfigMenu,
  donut: PieConfigMenu,
  polararea: PieConfigMenu,
  'pivot table': PivotTableConfigMenu,
  bubble: BubbleConfigMenu,
};

function ConfigMenu(props) {
  const datasetArray = getDatasetArray(props.datasets);
  const datasetOptions = getDatasetOptions(datasetArray);
  const visualisation = props.visualisation;
  const onChangeSpec = props.onChangeVisualisationSpec;
  const spec = visualisation.spec;

  const columns = props.datasets[visualisation.datasetId] ?
    props.datasets[visualisation.datasetId].get('columns') : Immutable.List();
  const columnOptions = getSelectMenuOptionsFromColumnList(columns, props.intl);

  const getChartTypeEditor = (visualisationType) => {
    if (!visualisationTypeComponents[visualisationType]) {
      throw new Error(`Invalid visualisation type "${visualisationType}"`);
    }
    const the = { component: visualisationTypeComponents[visualisationType] };
    return (
      <the.component
        visualisation={props.visualisation}
        onChangeSpec={props.onChangeVisualisationSpec}
        datasets={props.datasets}
        columnOptions={columnOptions}
        aggregationOptions={aggregationOptions}
      />
    );
  };

  return (
    <div className="ConfigMenu">
      <VisualisationTypeMenu
        onChangeVisualisationType={props.onChangeVisualisationType}
        visualisation={visualisation}
      />
      {visualisation.visualisationType && (
        <div>
          {visualisation.visualisationType === 'map' ? (
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
          ) : (
            <div>
              <DatasetMenu
                options={datasetOptions}
                onChange={props.onChangeSourceDataset}
                visualisation={visualisation}
              >
                <FilterMenu
                  hasDataset={Boolean(visualisation.datasetId !== null)}
                  onChangeSpec={onChangeSpec}
                  filters={spec.filters}
                  columnOptions={columnOptions}
                />
              </DatasetMenu>
              {(visualisation.datasetId && visualisation.visualisationType) &&
                getChartTypeEditor(visualisation.visualisationType)
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

ConfigMenu.propTypes = {
  intl: intlShape,
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

export default injectIntl(ConfigMenu);
