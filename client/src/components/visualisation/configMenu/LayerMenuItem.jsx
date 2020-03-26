import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import ContextMenu from '../../common/ContextMenu';
import ToggleInput from '../../common/ToggleInput';

require('./LayerMenuItem.scss');

class LayerMenuItem extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showOverflow: false,
      workingTitle: props.layer.title,
    };
  }

  render() {
    const {
      layer,
      layerIndex,
      titleEditMode,
      onBeginTitleEdit,
      onEndTitleEdit,
      onChangeTitle,
      onDeleteLayer,
      onSelectLayer,
      onChangeLayerOrder,
      intl,
      numLayers,
    } = this.props;

    return (
      <li
        className="LayerMenuItem"
      >
        {titleEditMode ?
          <div
            className="titleInputContainer"
          >
            <input
              type="text"
              value={this.state.workingTitle}
              onChange={evt => this.setState({
                workingTitle: evt.target.value,
              })}
            />
            <button
              className="clickable"
              onClick={() => {
                onChangeTitle(this.state.workingTitle);
                onEndTitleEdit();
              }}
            >
              <i className="fa fa-check-circle" />
            </button>
          </div>
          :
          <div
            className="container"
          >
            <span
              className="titleContainer"
            >
              <span
                onClick={() => onSelectLayer(layerIndex)}
                className="clickable title"
                data-test-id="layer"
              >
                {layer.title}
              </span>
            </span>
            <span className="orderButtonSection">
              {layerIndex > 0 ?
                <span className="orderButtonContainer">
                  <button
                    className={'clickable orderButton noSelect'}
                    onClick={() => onChangeLayerOrder(layerIndex, layerIndex - 1)}
                  >
                    <i className="fa fa-caret-up" />
                  </button>
                </span>
                :
                null
              }
              {layerIndex < numLayers ?
                <span className="orderButtonContainer">
                  <button
                    className={'clickable orderButton noSelect'}
                    onClick={() => onChangeLayerOrder(layerIndex, layerIndex + 1)}
                  >
                    <i className="fa fa-caret-down" />
                  </button>
                </span>
                :
                null
              }
            </span>
            <span
              className="toggleContainer notImplemented"
            >
              <ToggleInput
                checked={layer.visible}
                onChange={() => this.props.onSetLayerVisible(!layer.visible)}
              />
            </span>
            <span
              className="overflowButtonContainer"
            >
              <button
                className={`clickable overflowButton noSelect
                  ${this.state.showOverflow ? 'active' : 'inactive'}`}
                onClick={() => this.setState({ showOverflow: true })}
              >
                <i className="fa fa-ellipsis-h" />
              </button>
              {this.state.showOverflow &&
                <ContextMenu
                  style={{
                    top: '1.8rem',
                  }}
                  arrowClass="topRight"
                  options={[
                    { value: 'rename', label: intl.formatMessage({ id: 'rename' }) },
                    { value: 'delete', label: intl.formatMessage({ id: 'delete' }) },
                  ]}
                  onOptionSelected={(option) => {
                    if (option === 'rename') {
                      onBeginTitleEdit();
                    } else if (option === 'delete') {
                      onDeleteLayer();
                    }
                  }}
                  onWindowClick={() => this.setState({ showOverflow: false })}
                />
              }
            </span>
          </div>
        }
      </li>
    );
  }
}

LayerMenuItem.propTypes = {
  intl: intlShape,
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  titleEditMode: PropTypes.bool.isRequired,
  onBeginTitleEdit: PropTypes.func.isRequired,
  onEndTitleEdit: PropTypes.func.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onDeleteLayer: PropTypes.func.isRequired,
  onSelectLayer: PropTypes.func.isRequired,
  onSetLayerVisible: PropTypes.func.isRequired,
  numLayers: PropTypes.number.isRequired,
  onChangeLayerOrder: PropTypes.func.isRequired,
};

export default injectIntl(LayerMenuItem);
