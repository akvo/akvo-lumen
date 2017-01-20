import React, { Component, PropTypes } from 'react';
import SelectMenu from '../../common/SelectMenu';
import SelectInput from './SelectInput';
import { getPointColorValues } from '../../../utilities/chart';
import defaultColors from '../../../utilities/defaultColors';
import ButtonRowInput from './ButtonRowInput';
import ColorLabels from './ColorLabels';
import FilterMenu from './FilterMenu';

const getSelectMenuOptionsFromColumnList = columns => (columns == null ?
  [] : columns.map((column, index) => ({
    value: `${column.get('columnName')}`,
    index: index.toString(),
    title: `${column.get('title')}`,
    label: `${column.get('title')} [${column.get('type')}]`,
    type: `${column.get('type')}`,
  })).toArray());

const TabMenu = ({ activeTab, tabs, onChangeTab }) => (
  <ul
    className="TabMenu"
    style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderBottom: '0.1rem solid grey',
    }}
  >
    {tabs.map((tab, index) =>
      <li
        key={index}
        className={`tab ${tab === activeTab ? 'active' : 'inactive'}`}
        style={{
          flex: 1,
        }}
      >
        <button
          className="clickable"
          onClick={() => onChangeTab(tab)}
          style={{
            textTransform: 'uppercase',
            width: '70%',
            margin: '0 15%',
            fontSize: '0.8rem',
            textAlign: 'center',
            height: '3rem',
            color: tab === activeTab ? 'grey' : 'blue',
            borderBottom: tab === activeTab ? '0.2rem solid grey' : '0.2rem solid transparent',
          }}
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
    const { layer, layerIndex, onChangeMapLayer } = this.props;
    let tabContent;

    switch (this.state.activeTab) {
      case 'data':
        tabContent = (
          <div
            className="dataTab"
            style={{
              margin: '1rem',
            }}
          >
            <div className="inputGroup">
              <label htmlFor="xDatasetMenu">Source dataset:</label>
              <SelectMenu
                name="datasetMenu"
                placeholder="Choose dataset..."
                value={layer.datasetId !== null ?
                layer.datasetId.toString() : null}
                options={this.props.datasetOptions}
                onChange={datasetId => onChangeMapLayer(this.props.layerIndex, { datasetId })}
              />
            </div>
            <ButtonRowInput
              options={['geo-location', 'geo-shape']}
              disabled
              selected="geo-location"
              label="Layer type"
              onChange={() => null}
              buttonSpacing="2rem"
            />
            <div className="inputGroup">
              <SelectInput
                disabled={layer.datasetId === null}
                placeholder="Select a latitude column"
                labelText="Latitude column"
                choice={layer.latitude !== null ? layer.latitude.toString() : null}
                name="latitudeInput"
                options={columnOptions.filter(column => column.type === 'number')}
                onChange={value => onChangeMapLayer(layerIndex, {
                  latitude: value,
                })}
              />
            </div>
            <div className="inputGroup">
              <SelectInput
                disabled={layer.datasetId === null}
                placeholder="Select a longitude column"
                labelText="Longitude column"
                choice={layer.longitude !== null ? layer.longitude.toString() : null}
                name="longitudeInput"
                options={columnOptions.filter(column => column.type === 'number')}
                onChange={value => onChangeMapLayer(layerIndex, {
                  longitude: value,
                })}
              />
            </div>
            <div className="inputGroup">
              <SelectInput
                disabled={layer.latitude == null || layer.longitude == null}
                placeholder="Select a data column to color points by"
                labelText="Color coding column"
                choice={layer.pointColorColumn !== null ?
                  layer.pointColorColumn.toString() : null}
                name="xGroupColumnMenu"
                options={columnOptions}
                clearable
                onChange={columnName => this.handlePointColorColumnChange(columnName)}
              />
            </div>
            <FilterMenu
              filters={layer.filters}
              hasDataset={layer.datasetId !== null}
              columnOptions={columnOptions}
              onChangeSpec={object => onChangeMapLayer(layerIndex, object)}
            />
          </div>
        );
        break;
      case 'legend':
        tabContent = (
          <div
            className="legendTab"
            style={{
              margin: '1rem',
            }}
          >
            <div className="inputGroup">
              <label
                htmlFor="legend"
              >
                Legend
              </label>
              <input
                id="legend"
                type="checkbox"
                checked
                readOnly
              />
            </div>
            <ButtonRowInput
              options={['top', 'right', 'bottom', 'left']}
              label="Position"
              disabled={false}
              selected={layer.legend.position}
              onChange={(option) => {
                const legend = Object.assign({}, layer.legend);
                legend.position = option;
                this.props.onChangeMapLayer(layerIndex, { legend });
              }}
            />
            <div className="inputGroup">
              <label
                htmlFor="counters"
              >
                Counters
              </label>
              <input
                id="counters"
                type="checkbox"
                checked={false}
                readOnly
              />
            </div>
          </div>
        );
        break;
      case 'pop-up':
        tabContent = (
          <div
            className="popupTab"
          >
            <div
              className="inputGroup"
              style={{
                borderBottom: '0.1rem solid whitesmoke',
              }}
            >
              <label
                htmlFor="popup"
              >
                Pop-up
              </label>
              <input
                id="popup"
                type="checkbox"
                readOnly
              />
            </div>
            <div
              className="inputGroup"
            >
              {columnOptions.map((option, index) =>
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: '2rem',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                    }}
                  >
                    <input
                      style={{
                        fontSize: '1.2rem',
                      }}
                      className="clickable"
                      type="checkbox"
                      checked={this.props.layer.popup.findIndex(entry =>
                        entry.column === option.value) > -1}
                      onChange={() => this.handlePopupChange(option.value)}
                    />
                  </span>
                  <span
                    style={{
                      flex: 11,
                    }}
                  >
                    {option.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
        break;
      case 'theme':
        tabContent = (
          <div
            className="themeTab"
            style={{
              margin: '1rem',
            }}
          >
            <h3>Marker</h3>
            <ButtonRowInput
              options={['circle', 'square', 'triangle']}
              disabled
              selected="circle"
              label="Shape"
              onChange={() => null}
            />
            <ButtonRowInput
              options={['fill', 'outline']}
              disabled
              selected="fill"
              label="Style"
              onChange={() => null}
              buttonSpacing="2rem"
            />
            <ButtonRowInput
              options={['1', '2', '3', '4', '5']}
              disabled={false}
              selected={layer.pointSize ? layer.pointSize.toString() : null}
              label="Size"
              onChange={option => onChangeMapLayer(layerIndex, { pointSize: option })}
            />
            <hr />
            <h3>Color</h3>
            <ButtonRowInput
              options={['solid', 'gradient']}
              disabled
              selected="solid"
              label="Color option"
              onChange={() => null}
              buttonSpacing="2rem"
            />
            {layer.pointColorColumn &&
              <div className="inputGroup">
                <label
                  htmlFor="colors"
                >Colors</label>
                <ColorLabels
                  id="colors"
                  pointColorMapping={layer.pointColorMapping}
                  onChangeColor={(value, newColor) => this.handleChangeLabelColor(value, newColor)}
                />
              </div>
            }
          </div>
        );
        break;

      default:
        throw new Error(`Unknown tab ${this.state.activeTab}`);
    }

    return tabContent;
  }

  handlePointColorColumnChange(columnName) {
    const { datasets } = this.props;
    const dataset = datasets[this.props.layer.datasetId];
    const values = getPointColorValues(dataset, columnName, this.props.layer.filters);

    this.props.onChangeMapLayer(this.props.layerIndex, {
      pointColorColumn: columnName,
      pointColorMapping: values.map((value, index) => ({
        op: 'equals',
        value,
        color: defaultColors[index] || '#000000',
      })),
    });
  }

  handleChangeLabelColor(value, color) {
    const pointColorMapping = this.props.layer.pointColorMapping;

    this.props.onChangeMapLayer(this.props.layerIndex, {
      pointColorMapping: pointColorMapping.map((mapping) => {
        if (mapping.value === value) {
          return Object.assign({}, mapping, { color });
        }
        return mapping;
      }),
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
        style={{
          position: 'relative',
        }}
      >
        <div
          className="header"
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '4rem',
            borderBottom: '0.1rem solid grey',
          }}
        >
          <button
            className="clickable"
            onClick={this.props.onDeselectLayer}
            style={{
              fontSize: '1.6rem',
              flex: 1,
            }}
          >
            ←
          </button>
          <span
            style={{
              flex: 5,
              padding: '0 0.5rem',
            }}
          >
            <h2
              style={{
                fontStyle: 'italic',
              }}
            >
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
        <div
          className="saveContainer"
          style={{
            position: 'fixed',
            display: 'block',
            height: '4rem',
            width: '30%',
            minWidth: 1024 * 0.3,
            top: 'calc(100vh - 4rem)',
            backgroundColor: 'white',
          }}
        >
          <button
            className="clickable"
            style={{
              backgroundColor: 'grey',
              color: 'white',
              fontSize: '1rem',
              display: 'block',
              position: 'absolute',
              top: '0.5rem',
              bottom: '0.5rem',
              right: '0.5rem',
              left: '0.5rem',
              width: 'calc(100% - 1rem)',
              borderRadius: '0.2rem',
            }}
            onClick={this.props.onSave}
          >
            Save
          </button>
        </div>
      </div>
    );
  }
}

LayerConfigMenu.propTypes = {
  layer: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  datasetOptions: PropTypes.array.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  onDeselectLayer: PropTypes.func.isRequired,
  layerIndex: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
};
