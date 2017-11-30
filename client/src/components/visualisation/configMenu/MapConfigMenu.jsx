import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import VisualisationTypeMenu from '../VisualisationTypeMenu';
import LayerMenu from './LayerMenu';
import LayerConfigMenu from './LayerConfigMenu';
import ButtonRowInput from './ButtonRowInput';
import mapLayerSpecTemplate from '../../../containers/Visualisation/mapLayerSpecTemplate';

require('./MapConfigMenu.scss');

export default class MapConfigMenu extends Component {

  constructor() {
    super();
    this.state = {
      selectedLayer: null,
    };

    this.handleAddMapLayer = this.handleAddMapLayer.bind(this);
    this.handleDeleteMapLayer = this.handleDeleteMapLayer.bind(this);
    this.handleChangeMapLayer = this.handleChangeMapLayer.bind(this);
  }

  componentWillReceiveProps(next) {
    const prev = this.props;

    /* If only one geopoint column exists in dataset, select it for map.
    ** Complexity here is due to needing to wait until the dataset columns have loaded before
    ** we can check type of each column.
    */
    const haveVisualisation = next.visualisation && next.visualisation.spec.layers;
    if (haveVisualisation) {
      next.visualisation.spec.layers.forEach((layer, idx) => {
        const { datasetId } = layer;

        if (datasetId) {
          const datasetWasLoaded = prev.datasets[datasetId] && prev.datasets[datasetId].get('columns');
          const datasetIsLoaded = next.datasets[datasetId] && next.datasets[datasetId].get('columns');

          if (!datasetWasLoaded && datasetIsLoaded) {
            const columns = next.datasets[datasetId].get('columns');
            const geopointColumns = columns.filter(column => column.get('type') === 'geopoint').toArray();

            if (geopointColumns.length === 1) {
              // If there is exactly 1 geopoint column, set it as the layer geom for convenience
              this.handleChangeMapLayer(idx, { geom: geopointColumns[0].get('columnName') });
            }
          }
        }
      });
    }
  }

  handleAddMapLayer() {
    const title = `Untitled Layer ${this.props.visualisation.spec.layers.length + 1}`;
    const layers = this.props.visualisation.spec.layers.map(item => item);
    layers.push(Object.assign({}, mapLayerSpecTemplate, { title }));
    this.props.onChangeSpec({ layers });
  }

  handleDeleteMapLayer(layerIndex) {
    const layers = this.props.visualisation.spec.layers.map(item => item);
    layers.splice(layerIndex, 1);

    this.props.onChangeSpec({ layers });
  }

  handleChangeMapLayer(layerIndex, value) {
    const clonedLayer = Object.assign({}, this.props.visualisation.spec.layers[layerIndex], value);
    const layers = this.props.visualisation.spec.layers.map(item => item);
    layers[layerIndex] = clonedLayer;

    // Temporary shim while we still define datasetId on the top-level visualisation
    if (Object.keys(value).indexOf('datasetId') > -1) {
      const { datasetId } = value;

      this.props.onChangeSourceDataset(datasetId, { layers });
    } else {
      this.props.onChangeSpec({ layers });
    }
  }

  handlePopupChange(columnNames) {
    const popup = columnNames.map(columnName => ({
      column: columnName,
    }));
    this.props.onChangeSpec({ popup });
  }

  render() {
    const { visualisation, onChangeSpec } = this.props;
    const { spec } = visualisation;

    return (
      <div
        className="MapConfigMenu"
      >
        <div className="contents">
          {this.state.selectedLayer === null ?
            <div>
              <div
                className="drawer"
              >
                <VisualisationTypeMenu
                  onChangeVisualisationType={this.props.onChangeVisualisationType}
                  visualisation={visualisation}
                  disabled={false}
                />
              </div>
              <LayerMenu
                layers={this.props.visualisation.spec.layers}
                activeLayer={this.state.activeLayer}
                onAddLayer={() => this.handleAddMapLayer()}
                onDeleteMapLayer={layerIndex => this.handleDeleteMapLayer(layerIndex)}
                onSelectLayer={layerIndex => this.setState({ selectedLayer: layerIndex })}
                onChangeMapLayer={this.handleChangeMapLayer}
              />
              <div
                className="drawer"
              >
                <ButtonRowInput
                  options={['street', 'satellite', 'terrain'].map(item => ({
                    label: <FormattedMessage id={item} />,
                    value: item,
                  }))}
                  selected={visualisation.spec.baseLayer}
                  label="Base map"
                  onChange={baseLayer => onChangeSpec({ baseLayer })}
                />
              </div>
            </div>
          :
            <LayerConfigMenu
              layer={spec.layers[this.state.selectedLayer]}
              layerIndex={this.state.selectedLayer}
              onDeselectLayer={() => this.setState({ selectedLayer: null })}
              datasets={this.props.datasets}
              datasetOptions={this.props.datasetOptions}
              onChangeMapLayer={this.handleChangeMapLayer}
              onSave={this.props.onSave}
              disabled={visualisation.awaitingResponse}
            />
          }
        </div>
        <div
          className="saveContainer noSelect"
        >
          <button
            className="saveButton clickable"
            data-test-id="save-button"
            onClick={this.props.onSave}
          >
            <FormattedMessage id="save" />
          </button>
        </div>
      </div>
    );
  }
}

MapConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  datasetOptions: PropTypes.array.isRequired,
};
