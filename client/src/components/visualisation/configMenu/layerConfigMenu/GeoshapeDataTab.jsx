import React from 'react';
import PropTypes from 'prop-types';

import SelectInput from '../SelectInput';
import { filterColumns } from '../../../../utilities/utils';
import { getSelectMenuOptionsFromColumnList } from './util';
import ToggleInput from '../../../common/ToggleInput';
import ButtonRowInput from '../ButtonRowInput';

const getAggregationColumns = (layer, datasets) => {
  const out = [];

  if (!layer.aggregationDataset) {
    return out;
  }

  if (!datasets[layer.aggregationDataset] || !datasets[layer.aggregationDataset].get('columns')) {
    return out;
  }

  const aggregationColumnOptions =
    getSelectMenuOptionsFromColumnList(datasets[layer.aggregationDataset].get('columns'));

  return aggregationColumnOptions;
};

const GeoshapeDataTab = (props) => {
  const { layer,
    layerIndex,
    onChangeMapLayer,
    columnOptions,
    datasetOptions,
    datasets,
    disabled,
  } = props;

  const aggregationColumns = getAggregationColumns(layer, datasets);

  return (
    <div className="GeoshapeDataTab">
      <div className="inputGroup">
        <SelectInput
          disabled={layer.datasetId === null || disabled}
          placeholder="Select a geoshape column"
          labelText="Geoshape column"
          choice={layer.geom != null ? layer.geom.toString() : null}
          name="geomInput"
          options={filterColumns(columnOptions, 'geoshape')}
          onChange={value => onChangeMapLayer(layerIndex, {
            geom: value,
            latitude: null,
            longitude: null,
          })}
        />
      </div>
      <div className="shapeLabel">
        <ToggleInput
          className="shapeLabelToggle"
          size="small"
          label="Geoshape labels"
          disabled={disabled}
          checked={Boolean(layer.showShapeLabelInput)}
          onChange={(val) => {
            onChangeMapLayer(layerIndex, { showShapeLabelInput: val });
          }}
        />
        {layer.showShapeLabelInput &&
          <SelectInput
            clearable
            disabled={layer.datasetId === null || disabled}
            placeholder="Select a geoshape label column"
            choice={layer.shapeLabelColumn != null ? layer.shapeLabelColumn.toString() : null}
            name="shapeLabelInput"
            options={filterColumns(columnOptions, 'text')}
            onChange={value => onChangeMapLayer(layerIndex, {
              shapeLabelColumn: value,
            })}
          />
        }
      </div>
      <div className="inputGroup">
        <SelectInput
          disabled={(layer.datasetId == null) || disabled}
          placeholder="Select a styling dataset"
          labelText="Styling dataset"
          choice={layer.aggregationDataset != null ?
            layer.aggregationDataset.toString() : null}
          name="aggregationDataset"
          options={datasetOptions}
          clearable
          onChange={value => onChangeMapLayer(layerIndex, {
            aggregationDataset: value,
          })}
        />
      </div>
      <div className="inputGroup">
        <SelectInput
          disabled={(layer.aggregationDataset == null) || disabled}
          placeholder="Select styling indicator geopoint column"
          labelText="Styling indicator geopoint column"
          choice={layer.aggregationGeomColumn != null ?
            layer.aggregationGeomColumn.toString() : null}
          name="aggregationGeomColumn"
          options={filterColumns(aggregationColumns, ['geopoint'])}
          clearable
          onChange={value => onChangeMapLayer(layerIndex, {
            aggregationGeomColumn: value,
          })}
        />
      </div>
      <div className="inputGroup">
        <SelectInput
          disabled={(layer.aggregationDataset == null) || disabled}
          placeholder="Select styling indicator"
          labelText="Styling indicator"
          choice={layer.aggregationColumn != null ?
            layer.aggregationColumn.toString() : null}
          name="aggregationColumn"
          options={filterColumns(aggregationColumns, ['number'])}
          clearable
          onChange={value => onChangeMapLayer(layerIndex, {
            aggregationColumn: value,
          })}
        />
      </div>
      {Boolean(layer.aggregationGeomColumn) &&
        <div className="inputGroup">
          <ButtonRowInput
            options={[{
              label: 'Average',
              value: 'avg',
            }, {
              label: 'Sum',
              value: 'sum',
            },
              {
                label: 'Min',
                value: 'min',
              },
              {
                label: 'Max',
                value: 'max',
              },
              {
                label: 'Count',
                value: 'count',
              }]}
            selected={layer.aggregationMethod || 'avg'}
            label="Aggregation"
            onChange={value => onChangeMapLayer(layerIndex, {
              aggregationMethod: value,
            })}
            buttonSpacing="0"
          />
        </div>
      }
    </div>
  );
};

GeoshapeDataTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  datasetOptions: PropTypes.array.isRequired,
  datasets: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

export default GeoshapeDataTab;
