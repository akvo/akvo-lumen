import React, { Component, PropTypes } from 'react';
import ContextMenuItem from './ContextMenuItem';

require('../../styles/ContextMenu.scss');

const getArrowStyle = (className, offset = '0px') => {
  const style = {};
  let direction;

  switch (className) {
    case 'topLeft':
    case 'bottomLeft':
      direction = 'left';
      break;

    case 'topRight':
    case 'bottomRight':
      direction = 'right';
      break;

    default:
      throw new Error(`Unknown direction ${className} supplied to getArrowStyle`);
  }

  style[direction] = offset;

  return style;
};

export default class ContextMenu extends Component {

  constructor() {
    super();
    this.state = {
      windowListener: null,
      mountingClickReceived: false, // the click that caused this component to mount
    };
  }

  componentDidMount() {
    if (this.props.onWindowClick) {
      this.windowListener = () => {
        if (!this.state.mountingClickReceived) {
          this.setState({ mountingClickReceived: true });
        } else {
          this.props.onWindowClick();
        }
      };
      window.addEventListener('click', this.windowListener);
    }
  }

  componentWillUnmount() {
    if (this.props.onWindowClick) {
      window.removeEventListener('click', this.windowListener);
    }
  }

  render() {
    const props = this.props;
    const arrowClass = props.arrowClass ? `arrow arrow-${props.arrowClass}` : '';
    const arrowStyle = props.arrowOffset ?
      getArrowStyle(props.arrowClass, props.arrowOffset) : null;
    const handleItemClick = (newItem) => {
      const oldItem = props.selected;

      props.onOptionSelected(newItem, oldItem);
    };

    return (
      <div
        className={`ContextMenu noSelect
          ${props.containerClass} ${props.arrowClass ? 'hasArrow' : ''}`}
        style={props.style}
      >
        <span
          className={arrowClass}
          style={arrowStyle}
        />
        <ul>
          {props.options.map((item, index) => {
            const selected = item.value === props.selected ? 'selected' : '';
            return (
              <ContextMenuItem
                key={index}
                item={item}
                itemClass={props.itemClass}
                selectedClassName={selected}
                handleItemClick={handleItemClick}
                onOptionSelected={props.onOptionSelected}
                onWindowClick={props.onWindowClick ? props.onWindowClick : null}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}

ContextMenu.propTypes = {
  onOptionSelected: PropTypes.func.isRequired,
  onWindowClick: PropTypes.func,
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
  selected: PropTypes.string,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
  arrowClass: PropTypes.oneOf(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']),
  arrowOffset: PropTypes.string,
};
