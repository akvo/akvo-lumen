import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { GithubPicker } from 'react-color';
import { palette } from '../../../utilities/visualisationColors';
import { replaceLabelIfValueEmpty } from '../../../utilities/chart';

require('./ColorLabels.scss');

export default function ColorLabels({ pointColorMapping, onChangeColor }) {
  return (
    <ul
      className="ColorLabels"
    >
      {pointColorMapping.map(({ color, value }, idx) =>
        <li
          key={idx}
        >
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
            <GithubPicker
              color={color}
              colors={palette}
              onChangeComplete={evt => this.handleOnChangeColor(evt.hex)}
            />
          </div>
        }
        {' '}
        <span
          className={`${replaceLabelIfValueEmpty(value, true)}`}
        >
          {replaceLabelIfValueEmpty(value)}
        </span>
      </div>
    );
  }
}

ColorLabelItem.propTypes = {
  color: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChangeColor: PropTypes.func.isRequired,
};
