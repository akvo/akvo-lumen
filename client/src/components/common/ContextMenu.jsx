import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContextMenuItem from './ContextMenuItem';

require('./ContextMenu.scss');

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
  componentDidMount() {
    if (this.props.onWindowClick) {
      this.windowListener = () => this.props.onWindowClick();
      /* Wrapping in a setTimeout prevents the case where the same click event that caused the
      ** context menu to be mounted is also immediately heard by the new event listener, closing
      ** the menu instantly */
      setTimeout(() => {
        window.addEventListener('click', this.windowListener);
      }, 0);
    }
  }

  componentWillUnmount() {
    if (this.windowListener) {
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
          ${props.containerClass} ${props.arrowClass ? 'hasArrow' : ''}
          ${props.subMenuSide === 'left' ? 'leftSubMenu' : ''}
        `}
        data-test-id="context-menu"
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
                customClass={item.customClass}
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
  onWindowClick: PropTypes.func.isRequired,
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
  selected: PropTypes.string,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
  arrowClass: PropTypes.oneOf(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']),
  arrowOffset: PropTypes.string,
  subMenuSide: PropTypes.oneOf(['right', 'left']),
};
