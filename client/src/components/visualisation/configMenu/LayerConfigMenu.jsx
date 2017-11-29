import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SelectInput from './SelectInput';
import ButtonRowInput from './ButtonRowInput';
import ToggleInput from './ToggleInput';
import ColorLabels from './ColorLabels';
import FilterMenu from './FilterMenu';
import { filterColumns, checkUndefined } from '../../../utilities/utils';

require('./LayerConfigMenu.scss');

const getSelectMenuOptionsFromColumnList = columns => (columns == null ?
  [] : columns.map((column, index) => ({
    value: `${column.get('columnName')}`,
    index: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} (${column.get('type')})`,
    type: `${column.get('type')}`,
  })).toArray());

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
          {tab}
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

const GeopointDataTab = (props) => {
  const { layer,
    layerIndex,
    onChangeMapLayer,
    columnOptions,
    handlePointColorColumnChange,
    disabled,
  } = props;

  return (
    <div className="GeopointDataTab">
      {(layer.latitude != null || layer.longitude != null) &&
        <div>
          <div className="inputGroup">
            <SelectInput
              disabled={layer.datasetId === null || disabled}
              placeholder="Select a latitude column"
              labelText="Latitude column"
              choice={layer.latitude != null ? layer.latitude.toString() : null}
              name="latitudeInput"
              options={filterColumns(columnOptions, 'number')}
              onChange={value => onChangeMapLayer(layerIndex, {
                latitude: value,
              })}
            />
          </div>
          <div className="inputGroup">
            <SelectInput
              disabled={layer.datasetId === null || disabled}
              placeholder="Select a longitude column"
              labelText="Longitude column"
              choice={layer.longitude != null ? layer.longitude.toString() : null}
              name="longitudeInput"
              options={filterColumns(columnOptions, 'number')}
              onChange={value => onChangeMapLayer(layerIndex, {
                longitude: value,
              })}
            />
          </div>
          <hr />
        </div>
      }
      <div className="inputGroup">
        <SelectInput
          disabled={layer.datasetId === null || disabled}
          placeholder="Select a geopoint column"
          labelText="Geopoint column"
          choice={layer.geom != null ? layer.geom.toString() : null}
          name="geomInput"
          options={filterColumns(columnOptions, 'geopoint')}
          onChange={value => onChangeMapLayer(layerIndex, {
            geom: value,
            latitude: null,
            longitude: null,
          })}
        />
      </div>
      <div className="inputGroup">
        <SelectInput
          disabled={
            ((layer.latitude == null || layer.longitude == null) && layer.geom == null) ||
            disabled
          }
          placeholder="Select a data column to color points by"
          labelText="Color coding column"
          choice={layer.pointColorColumn != null ?
            layer.pointColorColumn.toString() : null}
          name="xGroupColumnMenu"
          options={filterColumns(columnOptions, ['text', 'number'])}
          clearable
          onChange={columnName =>
            handlePointColorColumnChange(columnName,
              columnOptions.find(option => option.value === columnName))}
        />
      </div>
    </div>
  );
};

GeopointDataTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  handlePointColorColumnChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const getAggregationColumns = (layer, datasets) => {
  const out = [];

  if (!layer.aggregationDataset) {
    return out;
  }

  if (!datasets[layer.aggregationDataset].get('columns')) {
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

const GeopointThemeTab = (props) => {
  const {
    onChangeMapLayer,
    columnOptions,
    layer,
    layerIndex,
    pointColorMapping,
    handleChangeLabelColor,
    disabled,
  } = props;

  return (
    <div
      className="themeTab"
    >
      <h3>Marker</h3>
      <ButtonRowInput
        options={['circle', 'square', 'triangle'].map(item => ({
          label: <FormattedMessage id={item} />,
          value: item,
        }))}
        disabled
        selected="circle"
        label="Shape"
        onChange={() => null}
      />
      <ButtonRowInput
        options={['fill', 'outline'].map(item => ({
          label: <FormattedMessage id={item} />,
          value: item,
        }))}
        disabled
        selected="fill"
        label="Style"
        onChange={() => null}
        buttonSpacing="2rem"
      />
      <ButtonRowInput
        options={['1', '2', '3', '4', '5'].map(item => ({
          label: item,
          value: item,
        }))}
        disabled={disabled}
        selected={layer.pointSize ? layer.pointSize.toString() : null}
        label="Size"
        onChange={option => onChangeMapLayer(layerIndex, { pointSize: option })}
      />
      <hr />
      <h3>Color</h3>
      <ButtonRowInput
        options={['solid', 'gradient'].map(item => ({
          label: <FormattedMessage id={item} />,
          value: item,
        }))}
        disabled
        selected="solid"
        label="Color option"
        onChange={() => null}
        buttonSpacing="2rem"
      />
      {pointColorMapping &&
        <div className="inputGroup">
          <label
            htmlFor="colors"
          >
            Colors ({columnOptions.find(obj => obj.value === layer.pointColorColumn).title})
          </label>
          <ColorLabels
            disabled={disabled}
            id="colors"
            pointColorMapping={pointColorMapping}
            onChangeColor={(value, newColor) => handleChangeLabelColor(pointColorMapping, value, newColor)}
          />
        </div>
      }
    </div>
  );
};

GeopointThemeTab.propTypes = {
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
    layer,
    layerIndex,
  } = props;

  return (
    <div
      className="themeTab"
    >
      {layer.aggregationColumn &&
        <ButtonRowInput
          options={['red', 'green', 'blue'].map(item => ({
            label: <FormattedMessage id={item} />,
            value: item,
          }))}
          selected={layer.gradientColor ? layer.gradientColor : 'red'}
          label="Gradient color"
          onChange={val => onChangeMapLayer(layerIndex, { gradientColor: val })}
          buttonSpacing="0"
        />
      }
    </div>
  );
};


GeoshapeThemeTab.propTypes = {
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
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
            <div className="inputGroup">
              <label htmlFor="xDatasetMenu">Source dataset:</label>
              <SelectMenu
                disabled={disabled}
                name="datasetMenu"
                placeholder="Choose dataset..."
                value={layer.datasetId !== null ?
                layer.datasetId.toString() : null}
                options={this.props.datasetOptions}
                onChange={datasetId => onChangeMapLayer(this.props.layerIndex, { datasetId })}
                buttonSpacing="0"
              />
            </div>
            <ButtonRowInput
              options={[{
                label: <FormattedMessage id="geo_location" />,
                value: 'geo-location',
              }, {
                label: <FormattedMessage id="geo_shape" />,
                value: 'geo-shape',
              }]}
              selected={layer.layerType || 'geo-location'}
              label="Layer type"
              onChange={value => onChangeMapLayer(layerIndex, {
                layerType: value,
              })}
              buttonSpacing="0"
            />
            {(layer.layerType === 'geo-shape') ?
              <GeoshapeDataTab
                layer={layer}
                layerIndex={layerIndex}
                onChangeMapLayer={onChangeMapLayer}
                columnOptions={columnOptions}
                datasetOptions={this.props.datasetOptions}
                datasets={this.props.datasets}
                disabled={disabled}
              />
              :
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
              label="Legend"
              onChange={(val) => {
                const legend = Object.assign({}, layer.legend);
                legend.visible = val;
                this.props.onChangeMapLayer(layerIndex, { legend });
              }}
            />
            <hr />
            <ButtonRowInput
              options={['top', 'right', 'bottom', 'left'].map(item => ({
                label: <FormattedMessage id={item} />,
                value: item,
              }))}
              label="Position"
              disabled={disabled}
              selected={layer.legend.position}
              onChange={(option) => {
                const legend = Object.assign({}, layer.legend);
                legend.position = option;
                this.props.onChangeMapLayer(layerIndex, { legend });
              }}
            />
            <hr
              className="notImplemented"
            />
            <ToggleInput
              className="inputGroup notImplemented"
              disabled
              checked={false}
              label="Counters"
              onChange={() => null}
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
        tabContent = layer.layerType === 'geo-shape' ?
          (<GeoshapeThemeTab
            onChangeMapLayer={this.props.onChangeMapLayer}
            layer={layer}
            disabled={disabled}
            layerIndex={layerIndex}
            columnOption={columnOptions}
            handleChangeLabelColor={this.handleChangeLabelColor}
          />)
          :
          (<GeopointThemeTab
            onChangeMapLayer={this.props.onChangeMapLayer}
            layer={layer}
            pointColorMapping={checkUndefined(metadata, 'layerMetadata', layerIndex, 'pointColorMapping') || []}
            disabled={disabled}
            layerIndex={layerIndex}
            columnOptions={columnOptions}
            handleChangeLabelColor={this.handleChangeLabelColor}
          />);
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
  datasetOptions: PropTypes.array.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  onDeselectLayer: PropTypes.func.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
