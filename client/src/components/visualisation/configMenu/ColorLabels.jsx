import React, { Component, PropTypes } from 'react';
import { GithubPicker } from 'react-color';

export default function ColorLabels({ pointColorMapping, onChangeColor }) {
  return (
    <ul
      className="ColorLabels"
    >
      {pointColorMapping.map(({ color, value }, idx) =>
        <li
          key={idx}
          style={{
            margin: '1rem 0',
            height: '2rem',
          }}
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
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <span
          className="clickable"
          onClick={() => {
            this.setState({ displayColorPicker: true, mountingClickReceived: false });
            window.addEventListener('click', this.windowListener);
          }}
          style={{
            display: 'inline-block',
            backgroundColor: color,
            width: '2rem',
            height: '2rem',
            marginRight: '0.75rem',
            borderRadius: '0.2rem',
            position: 'relative',
          }}
        >
          {!displayColorPicker &&
            <span
              style={{
                display: 'block',
                position: 'absolute',
                height: '0.5rem',
                width: '0.5rem',
                right: '0.3rem',
                bottom: '0.3rem',
                borderTop: '0.4rem solid white',
                borderRight: '0.4rem solid transparent',
                borderLeft: '0.4rem solid transparent',
              }}
            />
          }
        </span>
        {displayColorPicker &&
          <div
            style={{
              position: 'absolute',
              left: '-0.15rem',
              top: '2rem',
              zIndex: 2,
            }}
          >
            <GithubPicker
              color={color}
              onChangeComplete={evt => this.handleOnChangeColor(evt.hex)}
            />
          </div>
        }
        {' '}
        {value}
      </div>
    );
  }
}

ColorLabelItem.propTypes = {
  color: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChangeColor: PropTypes.func.isRequired,
};
