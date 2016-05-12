import React, { PropTypes } from 'react';

export default function TransformContextMenu(props) {
  const handleItemClick = newType => {
    props.onOptionSelected(props.selected, newType);
  };

  return (
    <div
      className="TransformContextMenu"
      style={props.style}
    >
      <ul>
        { props.options.map((item, index) => {
          const selected = item.value === props.selected ? ' selected' : '';

          return (
            <li
              key={index}
              className={`transformMenuItem clickable${selected}`}
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

TransformContextMenu.propTypes = {
  onOptionSelected: PropTypes.func.isRequired,
  style: PropTypes.object,
  options: PropTypes.array.isRequired,
  selected: PropTypes.string.isRequired,
};
