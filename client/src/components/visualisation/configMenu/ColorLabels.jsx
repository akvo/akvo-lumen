import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SwatchesPicker from 'react-color/lib/components/swatches/Swatches';
import { paletteSwatches } from '../../../utilities/visualisationColors';
import { replaceLabelIfValueEmpty } from '../../../utilities/chart';
import ColorPicker from '../../common/ColorPicker';

require('./ColorLabels.scss');

export default function ColorLabels({ pointColorMapping, onChangeColor }) {
  return (
    <ul
      className="ColorLabels"
    >
      {pointColorMapping.map(({ color, value }, idx) =>
        <li key={idx}>
          <ColorLabelItem
            color={color}
            value={value}
            onChangeColor={newColor => onChangeColor(value, newColor)}
          />
        </li>
      )}
    </ul>
  );
}

ColorLabels.propTypes = {
  colorPalette: PropTypes.array,
  pointColorMapping: PropTypes.array.isRequired,
  onChangeColor: PropTypes.func.isRequired,
};

class ColorLabelItem extends Component {
  constructor() {
    super();
    this.state = {
      displayColorPicker: false,
      mountingClickReceived: false,
    };
  }

  componentDidMount() {
    this.windowListener = () => {
      if (!this.state.mountingClickReceived) {
        this.setState({ mountingClickReceived: true });
      } else {
        this.setState({ displayColorPicker: false });
        window.removeEventListener('click', this.windowListener);
      }
    };
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.windowListener);
  }

  handleOnChangeColor(newColor) {
    this.setState({ displayColorPicker: false });
    this.props.onChangeColor(newColor);
  }

  render() {
    const { color, value } = this.props;
    const { displayColorPicker } = this.state;
    const title = replaceLabelIfValueEmpty(value);
    return (
      <div
        className="ColorLabelItem"
      >
        <span
          className="clickable colorIndicator"
          style={{
            backgroundColor: color,
          }}
          onClick={() => {
            this.setState({ displayColorPicker: true, mountingClickReceived: false });
            window.addEventListener('click', this.windowListener);
          }}
        >
          {!displayColorPicker &&
            <span className="arrowOverlay" />
          }
        </span>
        {displayColorPicker &&
          <div
            className="colorPickerContainer"
          >
            <ColorPicker
              title={title}
              left={14}
              placement="bottom-right"
              colors={paletteSwatches.concat([...SwatchesPicker.defaultProps.colors])}
              color={color}
              onChange={({ hex }) => {
                this.handleOnChangeColor(hex);
              }}
            />
          </div>
        }
        {' '}
        <span className={`${replaceLabelIfValueEmpty(value, true)}`}>
          {title}
        </span>
      </div>
    );
  }
}

ColorLabelItem.propTypes = {
  colorPalette: PropTypes.array,
  color: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChangeColor: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
