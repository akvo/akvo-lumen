import React, { Component, PropTypes } from 'react';
import ContextMenu from '../../common/ContextMenu';

export default class LayerMenuItem extends Component {

  constructor() {
    super();
    this.state = {
      showOverflow: false,
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
    } = this.props;

    return (
      <li
        style={{
          display: 'flex',
          flex: 1,
          height: '6rem',
          borderBottom: '0.1rem solid grey',
        }}
      >
        {titleEditMode ?
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '0 0.5rem 0 0.5rem',
            }}
          >
            <input
              style={{
                height: '2.4rem',
                fontSize: '1rem',
                lineHeight: '1.4rem',
                padding: '0.5rem 1rem',
              }}
              type="text"
              value={layer.title}
              onChange={evt => onChangeTitle(evt.target.value)}
            />
            <button
              className="clickable"
              style={{
                height: '2.4rem',
                fontSize: '1rem',
                lineHeight: '1.4rem',
                padding: '0.5rem 1rem',
              }}
              onClick={onEndTitleEdit}
            >
              ✓
            </button>
          </div>
          :
          <div
            style={{
              display: 'flex',
              flex: 1,
              margin: '0 0.5rem',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              onClick={() => onSelectLayer(layerIndex)}
              className="clickable"
              style={{
                flex: 4,
                padding: '2rem 0 2rem 1rem',
              }}
            >
              {layer.title}
            </span>
            <input
              style={{
                flex: 1,
              }}
              type="checkbox"
              checked={layer.visible}
              onChange={() => this.props.onSetLayerVisible(!layer.visible)}
            />
            <span
              style={{
                flex: 1,
              }}
            >
              <button
                className="clickable"
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem',

                }}
                onClick={() => this.setState({ showOverflow: true })}
              >
                ...
              </button>
              {this.state.showOverflow &&
                <ContextMenu
                  options={[
                    { value: 'edit', label: 'Edit' },
                    { value: 'delete', label: 'Delete' },
                  ]}
                  onOptionSelected={(option) => {
                    if (option === 'edit') {
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
  layer: PropTypes.object.isRequired,
  layerIndex: PropTypes.number.isRequired,
  titleEditMode: PropTypes.bool.isRequired,
  onBeginTitleEdit: PropTypes.func.isRequired,
  onEndTitleEdit: PropTypes.func.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onDeleteLayer: PropTypes.func.isRequired,
  onSelectLayer: PropTypes.func.isRequired,
  onSetLayerVisible: PropTypes.func.isRequired,

};

