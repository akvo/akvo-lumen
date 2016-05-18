import React, { PropTypes } from 'react';

require('../../styles/ContextMenu.scss');

export default function ContextMenu(props) {
  const handleItemClick = newItem => {
    const oldItem = props.selected;

    props.onOptionSelected(newItem, oldItem);
  };

  /* If no style is inherited, assume menu should appear at
  ** bottom left of parent element.
  */
  const defaultStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
  };
  const containerStyle = props.style ? props.style : defaultStyle;

  return (
    <div
      className={`ContextMenu ${props.containerClass}`}
      style={containerStyle}
    >
      <ul>
        {props.options.map((item, index) => {
          const selected = item.value === props.selected ? ' selected' : '';

          return (
            <li
              key={index}
              className={`contextMenuItem ${props.itemClass} clickable${selected}`}
              onClick={() => handleItemClick(item.value)}
            >
              {item.value}
            </li>
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
  selected: PropTypes.string.isRequired,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
};
