import React, { Component, PropTypes } from 'react';
import LayerMenuItem from './LayerMenuItem';

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
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'space-between',
            justifyContent: 'center',
            height: '6rem',
            backgroundColor: 'whitesmoke',
            fontSize: '1.4rem',
          }}
        >
          <span
            style={{
              flex: 3,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                height: '2.4rem',
                lineHeight: '1.4rem',
                padding: '0.5rem 1rem',
              }}
            >Layers</h3>
          </span>
          <span
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <button
              style={{
                fontSize: '1rem',
                backgroundColor: 'white',
                border: '0.1rem solid black',
                height: '2.4rem',
                lineHeight: '1.4rem',
                padding: '0.5rem 1rem',
                marginRight: '1rem',
              }}
              onClick={onAddLayer}
              disabled={layers.length >= 10}
            >
              Add
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
