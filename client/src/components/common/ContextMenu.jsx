import React, { PropTypes } from 'react';
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
      console.log('Unrecognized direction');
  }

  style[direction] = offset;

  return style;
};

export default function ContextMenu(props) {
  const arrowClass = props.arrowClass ? `arrow arrow-${props.arrowClass}` : '';
  const arrowStyle = props.arrowOffset ? getArrowStyle(props.arrowClass, props.arrowOffset) : null;
  const handleItemClick = newItem => {
    const oldItem = props.selected;

    props.onOptionSelected(newItem, oldItem);
  };

  return (
    <div
      className={`ContextMenu ${props.containerClass}`}
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
            />
          );
        })}
      </ul>
    </div>
  );
}

ContextMenu.propTypes = {
  onOptionSelected: PropTypes.func.isRequired,
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
  selected: PropTypes.string,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
  arrowClass: PropTypes.oneOf(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']),
  arrowOffset: PropTypes.string,
};
