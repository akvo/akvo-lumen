import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import get from 'lodash/get';

import SelectMenu from '../../common/SelectMenu';
import ButtonRowInput from './ButtonRowInput';
import ToggleInput from '../../common/ToggleInput';
import Button from '../../common/Button';
import ColorLabels from './ColorLabels';
import FilterMenu from './FilterMenu';
import { checkUndefined, sortAlphabetically } from '../../../utilities/utils';
import { filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';
import * as entity from '../../../domain/entity';
import { palette } from '../../../utilities/visualisationColors';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';
import { LegendsSortable,
         resetLegend } from '../../charts/LegendsSortable';

require('./LayerConfigMenu.scss');

const sourceDataset = { 'data-test-id': 'source-dataset-select' };

const geopoint = { 'data-test-id': 'geopoint-select' };

const colorCoding = { 'data-test-id': 'color-coding-select' };

const getDatasetOrRasterId = (layer) => {
  if (layer.rasterId) {
    return `raster-${layer.rasterId.toString()}`;
  }

  return layer.datasetId ? layer.datasetId.toString() : null;
};

const getSelectMenuOptionsFromColumnList = (columns, intl) => {
  if (columns == null) {
    return [];
  }

  const colMap = columns.map((column, index) => ({
    value: `${column.get('columnName')}`,
    index: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} (${intl.formatMessage({ id: column.get('type') }).toLowerCase()})`,
    type: `${column.get('type')}`,
    groupName: column.get('groupName'),
  })).toArray();

  return colMap;
};

const TabMenu = ({ activeTab, tabs, onChangeTab }) => (
  <ul
    className="TabMenu"
  >
    {tabs.map((tab, index) =>
      <li
        key={index}
        className={`tab ${tab === activeTab ? 'active' : 'inactive'}`}
      >
        <button
          className="tabButton clickable"
          onClick={() => onChangeTab(tab)}
        >
          <FormattedMessage id={tab} />
        </button>
      </li>
      )}
  </ul>
);

TabMenu.propTypes = {
  activeTab: PropTypes.string.isRequired,
  tabs: PropTypes.array.isRequired,
  onChangeTab: PropTypes.func.isRequired,
};

const GeopointDataTab = injectIntl((props) => {
  const { layer,
    layerIndex,
    onChangeMapLayer,
    columnOptions,
    handlePointColorColumnChange,
    disabled,
    intl,
  } = props;

  return (
    <div className="GeopointDataTab">
      {(layer.latitude != null || layer.longitude != null) &&
        <div>
          <div className="inputGroup">
            <ConfigMenuSectionOptionSelect
              disabled={layer.datasetId === null || disabled}
              placeholder={intl.formatMessage({ id: 'select_a_latitude_column' })}
              labelText={intl.formatMessage({ id: 'select_a_latitude_column' })}
              value={columnSelectSelectedOption(layer.latitude, filterColumns(columnOptions, 'number'))}
              name="latitudeInput"
              options={columnSelectOptions(intl, filterColumns(columnOptions, 'number'))}
              onChange={value => onChangeMapLayer(layerIndex, {
                latitude: value,
              })}
            />
          </div>
          <div className="inputGroup">
            <ConfigMenuSectionOptionSelect
              disabled={layer.datasetId === null || disabled}
              placeholder={intl.formatMessage({ id: 'select_a_longitude_column' })}
              labelText={intl.formatMessage({ id: 'select_a_longitude_column' })}
              value={columnSelectSelectedOption(layer.longitude, filterColumns(columnOptions, 'number'))}
              name="longitudeInput"
              options={columnSelectOptions(intl, filterColumns(columnOptions, 'number'))}
              onChange={value => onChangeMapLayer(layerIndex, {
                longitude: value,
              })}
            />
          </div>
          <hr />
        </div>
      }
      <div className="inputGroup">
        <ConfigMenuSectionOptionSelect
          disabled={layer.datasetId === null || disabled}
          placeholder={intl.formatMessage({ id: 'select_a_geopoint_column' })}
          labelTextId="geopoint_column"
          value={columnSelectSelectedOption(layer.geom, filterColumns(columnOptions, 'geopoint'))}
          name="geomInput"
          options={columnSelectOptions(intl, filterColumns(columnOptions, 'geopoint'))}
          onChange={value => onChangeMapLayer(layerIndex, {
            geom: value,
            latitude: null,
            longitude: null,
          })}
          inputProps={geopoint}
        />
      </div>
      <div className="inputGroup">
        <ConfigMenuSectionOptionSelect
          disabled={
            ((layer.latitude == null || layer.longitude == null) && layer.geom == null) ||
            disabled
          }
          placeholder={intl.formatMessage({ id: 'select_a_color_coding_column' })}
          labelTextId="color_coding_column"
          value={columnSelectSelectedOption(layer.pointColorColumn, filterColumns(columnOptions, ['text', 'number', 'option']))}
          name="xGroupColumnMenu"
          options={columnSelectOptions(intl, filterColumns(columnOptions, ['text', 'number', 'option']))}
          clearable
          onChange={columnName =>
            handlePointColorColumnChange(columnName,
              columnOptions.find(option => option.value === columnName))}
          inputProps={colorCoding}
        />
      </div>
    </div>
  );
});

GeopointDataTab.propTypes = {
  intl: intlShape,
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  handlePointColorColumnChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const getAggregationColumns = (layer, datasets, intl) => {
  const out = [];

  if (!layer.aggregationDataset) {
    return out;
  }

  if (!datasets[layer.aggregationDataset] || !datasets[layer.aggregationDataset].get('columns')) {
    return out;
  }

  const aggregationColumnOptions =
    getSelectMenuOptionsFromColumnList(datasets[layer.aggregationDataset].get('columns'), intl);

  return aggregationColumnOptions;
};

const GeoshapeDataTab = injectIntl((props) => {
  const { layer,
    layerIndex,
    onChangeMapLayer,
    columnOptions,
    datasetOptions,
    datasets,
    disabled,
    intl,
  } = props;

  const aggregationColumns = getAggregationColumns(layer, datasets, intl);

  return (
    <div className="GeoshapeDataTab">
      <ConfigMenuSectionOptionSelect
        disabled={layer.datasetId === null || disabled}
        placeholderId="select_a_geoshape_column"
        labelTextId="geoshape_column"
        value={columnSelectSelectedOption(layer.geom, filterColumns(columnOptions, 'geoshape'))}
        name="geomInput"
        options={columnSelectOptions(intl, filterColumns(columnOptions, 'geoshape'))}
        onChange={value => onChangeMapLayer(layerIndex, {
          geom: value,
          latitude: null,
          longitude: null,
        })}
      />
      <ToggleInput
        label={intl.formatMessage({ id: 'geoshape_labels' })}
        disabled={disabled}
        checked={Boolean(layer.showShapeLabelInput)}
        onChange={(val) => {
          onChangeMapLayer(layerIndex, { showShapeLabelInput: val });
        }}
      />
      {layer.showShapeLabelInput &&
        <ConfigMenuSectionOptionSelect
          clearable
          disabled={layer.datasetId === null || disabled}
          placeholderId="select_a_geoshape_label_column"
          value={columnSelectSelectedOption(layer.shapeLabelColumn, filterColumns(columnOptions, ['text', 'option']))}
          name="shapeLabelInput"
          options={columnSelectOptions(intl, filterColumns(columnOptions, ['text', 'option']))}
          onChange={value => onChangeMapLayer(layerIndex, {
            shapeLabelColumn: value,
          })}
        />
      }
      <ConfigMenuSectionOptionSelect
        disabled={(layer.datasetId == null) || disabled}
        placeholderId="select_a_styling_dataset"
        labelTextId="styling_dataset"
        value={layer.aggregationDataset != null ?
          layer.aggregationDataset.toString() : null}
        name="aggregationDataset"
        options={datasetOptions}
        clearable
        onChange={value => onChangeMapLayer(layerIndex, {
          aggregationDataset: value,
        })}
      />
      <ConfigMenuSectionOptionSelect
        disabled={(layer.aggregationDataset == null) || disabled}
        placeholderId="select_a_styling_indicator_geopoint_column"
        labelTextId="styling_indicator_geopoint_column"
        value={columnSelectSelectedOption(layer.aggregationGeomColumn, filterColumns(aggregationColumns, ['geopoint']))}
        name="aggregationGeomColumn"
        options={columnSelectOptions(intl, filterColumns(aggregationColumns, ['geopoint']))}
        clearable
        onChange={value => onChangeMapLayer(layerIndex, {
          aggregationGeomColumn: value,
        })}
      />
      <ConfigMenuSectionOptionSelect
        disabled={(layer.aggregationDataset == null) || disabled}
        placeholderId="select_a_styling_indicator"
        labelTextId="styling_indicator"
        value={columnSelectSelectedOption(layer.aggregationColumn, filterColumns(aggregationColumns, ['number']))}
        name="aggregationColumn"
        options={columnSelectOptions(intl, filterColumns(aggregationColumns, ['number']))}
        clearable
        onChange={value => onChangeMapLayer(layerIndex, {
          aggregationColumn: value,
        })}
      />
      {Boolean(layer.aggregationGeomColumn) &&
        <ButtonRowInput
          options={[
            {
              label: intl.formatMessage({ id: 'average' }),
              value: 'avg',
            },
            {
              label: intl.formatMessage({ id: 'sum' }),
              value: 'sum',
            },
            {
              label: intl.formatMessage({ id: 'min' }),
              value: 'min',
            },
            {
              label: intl.formatMessage({ id: 'max' }),
              value: 'max',
            },
            {
              label: intl.formatMessage({ id: 'count' }),
              value: 'count',
            },
          ]}
          selected={layer.aggregationMethod || 'avg'}
          label={intl.formatMessage({ id: 'aggregation' })}
          onChange={value => onChangeMapLayer(layerIndex, {
            aggregationMethod: value,
          })}
          buttonSpacing="0"
        />
      }
    </div>
  );
});

GeoshapeDataTab.propTypes = {
  intl: intlShape,
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  datasetOptions: PropTypes.array.isRequired,
  datasets: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

const RasterDataTab = () =>
  // No options yet
  (
    <div className="RasterDataTab">
      <div className="inputGroup" />
    </div>
  );

RasterDataTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  datasetOptions: PropTypes.array.isRequired,
  datasets: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};

const GeopointThemeTab = injectIntl((props) => {
  const {
    onChangeMapLayer,
    columnOptions,
    layer,
    layerIndex,
    pointColorMapping,
    handleChangeLabelColor,
    disabled,
    intl,
  } = props;

  return (
    <div
      className="themeTab"
    >
      <ButtonRowInput
        options={['1', '2', '3', '4', '5'].map(item => ({
          label: item,
          value: item,
        }))}
        disabled={disabled}
        selected={layer.pointSize ? layer.pointSize.toString() : null}
        label={intl.formatMessage({ id: 'point_size' })}
        onChange={option => onChangeMapLayer(layerIndex, { pointSize: option })}
      />
      <hr />
      <h3>
        <FormattedMessage id="color" />
      </h3>
      {Boolean(pointColorMapping && pointColorMapping.length) &&
        <div className="inputGroup">
          <label htmlFor="colors">
            <FormattedMessage
              id="colors_for_title"
              values={{
                title: columnOptions.find(obj => obj.value === layer.pointColorColumn).title,
              }}
            />
          </label>
          <ColorLabels
            disabled={disabled}
            id="colors"
            pointColorMapping={pointColorMapping}
            onChangeColor={
              (value, newColor) => handleChangeLabelColor(pointColorMapping, value, newColor)
            }
          />
        </div>
      }
    </div>
  );
});

GeopointThemeTab.propTypes = {
  intl: intlShape,
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  handleChangeLabelColor: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  pointColorMapping: PropTypes.array.isRequired,
  columnOptions: PropTypes.array.isRequired,
};

const GeoshapeThemeTab = (props) => {
  const {
    onChangeMapLayer,
    layerIndex,
    colors,
    gradientColor,
    disabled,
  } = props;

  return (
    <div
      className="themeTab"
    >
      {colors &&
        <ColorLabels
          pointColorMapping={[{ value: 'Gradient color', color: gradientColor }]}
          colorPalette={colors}
          disabled={disabled}
          onChangeColor={(ignore, color) => onChangeMapLayer(layerIndex, { gradientColor: color })}
        />
      }
    </div>
  );
};


GeoshapeThemeTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  colors: PropTypes.array,
  gradientColor: PropTypes.string,
  disabled: PropTypes.bool,
};

const RasterThemeTab = (props) => {
  const {
    onChangeMapLayer,
    layerIndex,
    disabled,
    startColor,
    endColor,
  } = props;

  return (
    <div
      className="themeTab"
    >
      <ColorLabels
        pointColorMapping={[{ value: 'startColor', color: startColor || '#FFFFFF' }, { value: 'endColor', color: endColor || '#000000' }]}
        colorPalette={[...palette, '#FFFFFF']}
        disabled={disabled}
        onChangeColor={(value, color) => {
          if (value === 'startColor') {
            onChangeMapLayer(layerIndex, { startColor: color });
          } else {
            onChangeMapLayer(layerIndex, { endColor: color });
          }
        }}
      />
    </div>
  );
};

RasterThemeTab.propTypes = {
  startColor: PropTypes.string,
  endColor: PropTypes.string,
  onChangeMapLayer: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  layerIndex: PropTypes.number.isRequired,
};

class LayerConfigMenu extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: 'data',
    };

    this.getTabContent = this.getTabContent.bind(this);
    this.handlePointColorColumnChange = this.handlePointColorColumnChange.bind(this);
    this.handleChangeLabelColor = this.handleChangeLabelColor.bind(this);
    this.handlePopupChange = this.handlePopupChange.bind(this);
  }

  getTabContent(columnOptions) {
    const { layer, layerIndex, metadata, onChangeMapLayer, disabled, intl } = this.props;
    let tabContent;
    const specLegend = layer.legend || {};
    const orderType = layer.pointColorColumn ? columnOptions.find(({ value }) => value === layer.pointColorColumn).type : 'text';
    const visualisation = {
      data:
      { common: {
        data: (get(metadata, `layerMetadata[${layerIndex}].pointColorMapping`) || [])
              .map(({ value }) => ({ key: value })),
        metadata: { type: orderType } } } };
    const onChangeSpec = object => onChangeMapLayer(layerIndex, object);
    switch (this.state.activeTab) {
      case 'data':
        tabContent = (
          <div className="dataTab">
            <div className="inputGroup">
              <label htmlFor="xDatasetMenu">
                <FormattedMessage id="source_dataset" />:
              </label>
              <SelectMenu
                disabled={disabled}
                name="datasetMenu"
                placeholder={intl.formatMessage({ id: 'choose_dataset' })}
                value={getDatasetOrRasterId(layer)}
                options={this.props.datasetOptions
                  .concat(
                    Object.keys(this.props.rasters)
                      .map(key => this.props.rasters[key])
                      .map(raster => ({
                        value: `raster-${entity.getId(raster)}`,
                        label: entity.getTitle(raster),
                      }))
                  )
                  .sort((a, b) =>
                    sortAlphabetically(a, b, ({ label }) => label)
                  )}
                onChange={(datasetId) => {
                  if (datasetId.indexOf('raster') > -1) {
                    onChangeMapLayer(this.props.layerIndex, {
                      rasterId: datasetId.replace('raster-', ''),
                      datasetId: null,
                    });
                  } else {
                    onChangeMapLayer(this.props.layerIndex, {
                      datasetId,
                      rasterId: null,
                    });
                  }
                }}
                buttonSpacing="0"
                data-test-id="source-dataset"
                inputProps={sourceDataset}
              />
            </div>
            <ButtonRowInput
              options={[
                {
                  label: <FormattedMessage id="geo_location" />,
                  value: 'geo-location',
                },
                {
                  label: <FormattedMessage id="geo_shape" />,
                  value: 'geo-shape',
                },
                {
                  label: <FormattedMessage id="raster" />,
                  value: 'raster',
                },
              ]}
              selected={layer.layerType || 'geo-location'}
              label={intl.formatMessage({ id: 'layer_type' })}
              onChange={value =>
                onChangeMapLayer(layerIndex, {
                  layerType: value,
                })
              }
              buttonSpacing="0"
            />
            {layer.layerType === 'geo-shape' && (
              <div>
                <GeoshapeDataTab
                  layer={layer}
                  layerIndex={layerIndex}
                  onChangeMapLayer={onChangeMapLayer}
                  columnOptions={columnOptions}
                  datasetOptions={this.props.datasetOptions}
                  datasets={this.props.datasets}
                  disabled={disabled}
                />
                <FilterMenu
                  filters={layer.filters}
                  hasDataset={layer.datasetId !== null}
                  columnOptions={filterColumns(columnOptions, [
                    'option',
                    'text',
                    'number',
                    'date',
                  ])}
                  onChangeSpec={object =>
                    onChangeMapLayer(layerIndex, object)
                  }
                />
              </div>
            )}
            {layer.layerType === 'raster' && (
              <RasterDataTab
                layer={layer}
                layerIndex={layerIndex}
                onChangeMapLayer={onChangeMapLayer}
                columnOptions={columnOptions}
                datasetOptions={this.props.datasetOptions}
                datasets={this.props.datasets}
                disabled={disabled}
              />
            )}
            {(layer.layerType === 'geo-location' || !layer.layerType) && (
              <div>
                <GeopointDataTab
                  layer={layer}
                  layerIndex={layerIndex}
                  onChangeMapLayer={onChangeMapLayer}
                  columnOptions={columnOptions}
                  handlePointColorColumnChange={
                    this.handlePointColorColumnChange
                  }
                  disabled={disabled}
                />
                <FilterMenu
                  filters={layer.filters}
                  hasDataset={layer.datasetId !== null}
                  columnOptions={filterColumns(columnOptions, [
                    'option',
                    'text',
                    'number',
                    'date',
                  ])}
                  onChangeSpec={object =>
                    onChangeMapLayer(layerIndex, object)
                  }
                />
              </div>
            )}
          </div>
        );
        break;
      case 'legend':
        tabContent = (
          <div
            className="legendTab"
          >
            <ToggleInput
              disabled={disabled}
              className="inputGroup"
              checked={layer.legend.visible}
              label={intl.formatMessage({ id: 'show_legend' })}
              onChange={(val) => {
                const legend = Object.assign({}, layer.legend);
                legend.visible = val;
                this.props.onChangeMapLayer(layerIndex, { legend });
              }}
            />
            {Boolean(layer.legend.visible) && (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <ButtonRowInput
                    labelClass="label"
                    options={[{
                      label: <FormattedMessage id="legend_order_auto_mode" />,
                      value: 'auto',
                    }, {
                      label: <FormattedMessage id="legend_order_custom_mode" />,
                      value: 'custom',
                    }]}
                    selected={get(layer, 'legend.order.mode') || 'auto'}
                    label={intl.formatMessage({ id: 'legend_category_order' })}
                    onChange={(val) => {
                      const legend = resetLegend(specLegend, visualisation, val, null, true);
                      onChangeSpec({ legend });
                    }}
                    buttonSpacing="0"
                  />
                  <LegendsSortable
                    onChangeSpec={onChangeSpec}
                    visualisation={visualisation}
                    colors={(get(metadata, `layerMetadata[${layerIndex}].pointColorMapping`) || [])
                            .map(({ value, color }) => {
                              const c = {}; c[value] = color; return c;
                            })
                            .reduce((accumulator, currentValue) =>
                            ({ ...accumulator, ...currentValue }), {})}
                    specLegend={specLegend}
                    noSort
                  />
                </div>
              </div>
            )}

          </div>
        );
        break;
      case 'popup':
        tabContent = (
          <div
            className="popupTab"
          >
            <ToggleInput
              className="inputGroup"
              disabled={disabled || false}
              checked={(layer.popup && layer.popup.length > 0) || false}
              label={intl.formatMessage({ id: 'popup' })}
              onChange={(x) => {
                if (x) {
                  this.handlePopupChange(filterColumns(columnOptions, ['text', 'number', 'date'])[0].value);
                } else {
                  this.props.onChangeMapLayer(this.props.layerIndex, { popup: [] });
                }
              }}
            />
            <div
              className="inputGroup"
            >
              {filterColumns(columnOptions, ['option', 'text', 'number', 'date']).map((option, index) =>
                <div
                  className="optionContainer"
                  key={index}
                >
                  <span
                    className="controlContainer"
                  >
                    <input
                      className="clickable"
                      type="checkbox"
                      checked={this.props.layer.popup.findIndex(entry =>
                        entry.column === option.value) > -1}
                      onChange={() => this.handlePopupChange(option.value)}
                      disabled={disabled}
                    />
                  </span>
                  <span
                    className="columnLabelContainer"
                    title={option.label}
                  >
                    {(option.label && option.label.length > 128) ?
                      `${option.label.substring(0, 128)}...`
                      :
                      option.label
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        );
        break;
      case 'theme':
        if (layer.layerType === 'geo-shape') {
          tabContent =
            (<GeoshapeThemeTab
              onChangeMapLayer={this.props.onChangeMapLayer}
              layer={layer}
              disabled={disabled}
              layerIndex={layerIndex}
              columnOption={columnOptions}
              colors={checkUndefined(metadata, 'layerMetadata', layerIndex, 'availableColors') || null}
              gradientColor={checkUndefined(metadata, 'layerMetadata', layerIndex, 'shapeColorMapping', 1, 'color') || null}
            />);
        } else if (layer.layerType === 'raster') {
          tabContent =
            (<RasterThemeTab
              onChangeMapLayer={this.props.onChangeMapLayer}
              layer={layer}
              disabled={disabled}
              layerIndex={layerIndex}
              handleChangeLabelColor={this.handleChangeLabelColor}
              startColor={layer.startColor}
              endColor={layer.endColor}
            />);
        } else {
          tabContent =
            (<GeopointThemeTab
              onChangeMapLayer={this.props.onChangeMapLayer}
              layer={layer}
              pointColorMapping={checkUndefined(metadata, 'layerMetadata', layerIndex, 'pointColorMapping') || []}
              disabled={disabled}
              layerIndex={layerIndex}
              columnOptions={columnOptions}
              handleChangeLabelColor={this.handleChangeLabelColor}
            />);
        }
        break;

      default:
        throw new Error(`Unknown tab ${this.state.activeTab}`);
    }

    return tabContent;
  }

  handlePointColorColumnChange(columnName = null, columnOption = null) {
    let legend;

    if (columnOption != null) {
      legend = Object.assign({}, this.props.layer.legend, { title: columnOption.title, order: {} });
    } else {
      legend = Object.assign({}, this.props.layer.legend, { title: null, order: {} });
    }

    this.props.onChangeMapLayer(this.props.layerIndex, {
      legend,
      pointColorColumn: columnName,
    });
  }

  handleChangeLabelColor(pointColorMapping = [], value, color) {
    /* TODO - we should change the name of the array of custom layer colors from
    ** "pointColorMapping" to something else - like "customPointColors" - because it's
    ** needlessly confusing to use the same name for the metadata returned by the maps backend
    ** and the permanent record of custom colors picked by the users.
    ** Leaving as-is for now because it will involve nontrivial compatibility work.
    */
    const newMapping = pointColorMapping.map((o) => {
      if (o.value === value) {
        return Object.assign(
          {},
          o,
          { color }
        );
      }
      return o;
    });

    this.props.onChangeMapLayer(this.props.layerIndex, {
      pointColorMapping: newMapping,
    });
  }

  handlePopupChange(columnName) {
    const popup = this.props.layer.popup.map(item => item);
    const index = popup.findIndex(item => item.column === columnName);
    const removeColumn = index > -1;

    if (removeColumn) {
      popup.splice(index, 1);
    } else {
      popup.push({ column: columnName });
    }
    this.props.onChangeMapLayer(this.props.layerIndex, { popup });
  }


  render() {
    const { layer, datasets, intl } = this.props;
    const columns = datasets[layer.datasetId] ?
    datasets[layer.datasetId].get('columns') : null;
    const columnOptions = getSelectMenuOptionsFromColumnList(columns, intl);

    return (
      <ConfigMenuSection
        options={(
          <div className="LayerConfigMenu">
            <div
              className="header"
            >
              <span
                className="layerTitleContainer"
              >
                <h2>
                  <Button link lg onClick={this.props.onDeselectLayer}>
                    <i className="fa fa-chevron-left" />
                  </Button>
                  {layer.title}
                </h2>
              </span>
            </div>
            <TabMenu
              activeTab={this.state.activeTab}
              onChangeTab={tab => this.setState({ activeTab: tab })}
              tabs={['data', 'legend', 'popup', 'theme']}
            />
            <div className="tabContent">
              {this.getTabContent(columnOptions)}
            </div>
          </div>
        )}
      />
    );
  }
}

LayerConfigMenu.propTypes = {
  intl: intlShape,
  layer: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  datasets: PropTypes.object.isRequired,
  rasters: PropTypes.object.isRequired,
  startColor: PropTypes.string,
  endColor: PropTypes.string,
  onChangeMapLayer: PropTypes.func.isRequired,
  datasetOptions: PropTypes.array.isRequired,
  onDeselectLayer: PropTypes.func.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  env: PropTypes.object.isRequired,
};

export default injectIntl(LayerConfigMenu);
