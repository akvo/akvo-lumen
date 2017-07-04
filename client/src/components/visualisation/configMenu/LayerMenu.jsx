import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LayerMenuItem from './LayerMenuItem';

require('./LayerMenu.scss');

export default class LayerMenu extends Component {

  constructor() {
    super();
    this.state = {
      activeLayerTitleEditor: null,
    };
  }

  render() {
    const {
      layers,
      onAddLayer,
      onSelectLayer,
      onChangeMapLayer,
      onDeleteMapLayer,
    } = this.props;

    return (
      <div className="LayerMenu">
        <div
          className="controlRow"
        >
          <span
            className="titleContainer"
          >
            <h3>Layers</h3>
          </span>
          <span
            className="buttonContainer"
          >
            <button
              className="addLayer clickable noSelect"
              onClick={onAddLayer}
              disabled={layers.length >= 1}
            >
              <i className="fa fa-plus" aria-hidden="true" />
            </button>
          </span>
        </div>
        {layers.length === 0 ?
          null
          :
          <ul>
            {layers.map((layer, index) =>
              <LayerMenuItem
                key={index}
                layer={layer}
                layerIndex={index}
                titleEditMode={this.state.activeLayerTitleEditor === index}
                onBeginTitleEdit={() => this.setState({ activeLayerTitleEditor: index })}
                onEndTitleEdit={() => this.setState({ activeLayerTitleEditor: null })}
                onChangeTitle={title => onChangeMapLayer(index, { title })}
                onDeleteLayer={() => onDeleteMapLayer(index)}
                onSelectLayer={onSelectLayer}
                onSetLayerVisible={isVisible => onChangeMapLayer(index, { visible: isVisible })}
              />
            )}
          </ul>
        }
      </div>
    );
  }
}

LayerMenu.propTypes = {
  layers: PropTypes.array.isRequired,
  activeLayer: PropTypes.number,
  onAddLayer: PropTypes.func.isRequired,
  onSelectLayer: PropTypes.func.isRequired,
  onChangeMapLayer: PropTypes.func.isRequired,
  onDeleteMapLayer: PropTypes.func.isRequired,
};
