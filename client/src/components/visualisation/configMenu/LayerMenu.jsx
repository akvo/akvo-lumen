import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import LayerMenuItem from './LayerMenuItem';
import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import Button from '../../common/Button';

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
        <ConfigMenuSection
          title="layers"
          options={(
            <div>
              {layers.length ? (
                <ul>
                  {layers.map((layer, index) =>
                    <LayerMenuItem
                      key={index}
                      layer={layer}
                      layerIndex={index}
                      numLayers={layers.length - 1}
                      titleEditMode={this.state.activeLayerTitleEditor === index}
                      onBeginTitleEdit={() => this.setState({ activeLayerTitleEditor: index })}
                      onEndTitleEdit={() => this.setState({ activeLayerTitleEditor: null })}
                      onChangeTitle={title => onChangeMapLayer(index, { title })}
                      onDeleteLayer={() => onDeleteMapLayer(index)}
                      onSelectLayer={onSelectLayer}
                      onSetLayerVisible={isVisible =>
                        onChangeMapLayer(index, { visible: isVisible })
                      }
                      onChangeLayerOrder={this.props.onChangeLayerOrder}
                    />
                  )}
                </ul>
              ) : null}
              <Button onClick={onAddLayer} primary>
                <i className="fa fa-plus" aria-hidden="true" />
                &nbsp;
                <FormattedMessage id="add_layer" />
              </Button>
            </div>
          )}
        />
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
  onChangeLayerOrder: PropTypes.func.isRequired,
};
