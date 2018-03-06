import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import ButtonRowInput from './ButtonRowInput';
import ToggleInput from '../../common/ToggleInput';
import FilterMenu from './FilterMenu';
import { filterColumns, checkUndefined, sortAlphabetically } from '../../../utilities/utils';
import * as entity from '../../../domain/entity';
import GeopointDataTab from './layerConfigMenu/GeopointDataTab';
import GeoshapeDataTab from './layerConfigMenu/GeoshapeDataTab';
import RasterDataTab from './layerConfigMenu/RasterDataTab';
import GeopointThemeTab from './layerConfigMenu/GeopointThemeTab';
import GeoshapeThemeTab from './layerConfigMenu/GeoshapeThemeTab';
import RasterThemeTab from './layerConfigMenu/RasterThemeTab';
import TabMenu from './layerConfigMenu/TabMenu';
import { getSelectMenuOptionsFromColumnList } from './layerConfigMenu/util';

require('./LayerConfigMenu.scss');

const sourceDataset = { 'data-test-id': 'source-dataset-select' };

const getDatasetOrRasterId = (layer) => {
  if (layer.rasterId) {
    return `raster-${layer.rasterId.toString()}`;
  }

  return layer.datasetId ? layer.datasetId.toString() : null;
};

export default class LayerConfigMenu extends Component {
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
    const { layer, layerIndex, metadata, onChangeMapLayer, disabled } = this.props;
    let tabContent;

    switch (this.state.activeTab) {
      case 'data':
        tabContent = (
          <div
            className="dataTab"
          >
            <div
              className="inputGroup"
            >
              <label
                htmlFor="xDatasetMenu"
              >Source dataset:</label>
              <SelectMenu
                disabled={disabled}
                name="datasetMenu"
                placeholder="Choose dataset..."
                value={getDatasetOrRasterId(layer)}
                options={
                  this.props.datasetOptions.concat(
                    Object.keys(this.props.rasters)
                      .map(key => this.props.rasters[key])
                      .map(raster => ({
                        value: `raster-${entity.getId(raster)}`,
                        label: entity.getTitle(raster),
                      }))
                  )
                  .sort((a, b) => sortAlphabetically(a, b, ({ label }) => label))
                }
                onChange={(datasetId) => {
                  if (datasetId.indexOf('raster') > -1) {
                    onChangeMapLayer(this.props.layerIndex, { rasterId: datasetId.replace('raster-', ''), datasetId: null });
                  } else {
                    onChangeMapLayer(this.props.layerIndex, { datasetId, rasterId: null });
                  }
                }
                }
                buttonSpacing="0"
                data-test-id="source-dataset"
                inputProps={sourceDataset}
              />
            </div>
            <ButtonRowInput
              options={[{
                label: <FormattedMessage id="geo_location" />,
                value: 'geo-location',
              }, {
                label: <FormattedMessage id="geo_shape" />,
                value: 'geo-shape',
              }, {
                label: 'raster',
                value: 'raster',
              }]}
              selected={layer.layerType || 'geo-location'}
              label="Layer type"
              onChange={value => onChangeMapLayer(layerIndex, {
                layerType: value,
              })}
              buttonSpacing="0"
            />
            {(layer.layerType === 'geo-shape') &&
              <GeoshapeDataTab
                layer={layer}
                layerIndex={layerIndex}
                onChangeMapLayer={onChangeMapLayer}
                columnOptions={columnOptions}
                datasetOptions={this.props.datasetOptions}
                datasets={this.props.datasets}
                disabled={disabled}
              />
            }
            {(layer.layerType === 'raster') &&
              <RasterDataTab
                layer={layer}
                layerIndex={layerIndex}
                onChangeMapLayer={onChangeMapLayer}
                columnOptions={columnOptions}
                datasetOptions={this.props.datasetOptions}
                datasets={this.props.datasets}
                disabled={disabled}
              />
            }
            {(layer.layerType === 'geo-location' || !layer.layerType) &&
              <div>
                <GeopointDataTab
                  layer={layer}
                  layerIndex={layerIndex}
                  onChangeMapLayer={onChangeMapLayer}
                  columnOptions={columnOptions}
                  handlePointColorColumnChange={this.handlePointColorColumnChange}
                  disabled={disabled}
                />
                <FilterMenu
                  filters={layer.filters}
                  hasDataset={layer.datasetId !== null}
                  columnOptions={filterColumns(columnOptions, ['text', 'number', 'date'])}
                  onChangeSpec={object => onChangeMapLayer(layerIndex, object)}
                />
              </div>
            }
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
              label="Show legend"
              onChange={(val) => {
                const legend = Object.assign({}, layer.legend);
                legend.visible = val;
                this.props.onChangeMapLayer(layerIndex, { legend });
              }}
            />

          </div>
        );
        break;
      case 'pop-up':
        tabContent = (
          <div
            className="popupTab"
          >
            <ToggleInput
              className="inputGroup"
              disabled
              checked
              label="Pop-up"
              onChange={() => null}
            />
            <hr />
            <div
              className="inputGroup"
            >
              {filterColumns(columnOptions, ['text', 'number', 'date']).map((option, index) =>
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
      legend = Object.assign({}, this.props.layer.legend, { title: columnOption.title });
    } else {
      legend = Object.assign({}, this.props.layer.legend, { title: null });
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
    const { layer, datasets } = this.props;
    const columns = datasets[layer.datasetId] ?
    datasets[layer.datasetId].get('columns') : null;
    const columnOptions = getSelectMenuOptionsFromColumnList(columns);

    return (
      <div
        className="LayerConfigMenu"
      >
        <div
          className="header"
        >
          <button
            className="clickable deselectLayer"
            onClick={this.props.onDeselectLayer}
          >
            ←
          </button>
          <span
            className="layerTitleContainer"
          >
            <h2>
              {layer.title}
            </h2>
          </span>
        </div>
        <TabMenu
          activeTab={this.state.activeTab}
          onChangeTab={tab => this.setState({ activeTab: tab })}
          tabs={['data', 'legend', 'pop-up', 'theme']}
        />
        <div className="tabContent">
          {this.getTabContent(columnOptions)}
        </div>
      </div>
    );
  }
}

LayerConfigMenu.propTypes = {
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
};
