import React, { PropTypes, Component } from 'react';
import ContextMenu from './ContextMenu';

export default class ContextMenuItem extends Component {
  constructor() {
    super();
    this.state = {
      isHovered: false,
    };
  }

  render() {
    const item = this.props.item;
    const onClick = item.subMenu ? null : (event) => {
      event.stopPropagation();
      this.props.handleItemClick(item.value);
    };

    return (
      <li
        className={`contextMenuItem ${this.props.itemClass}
          clickable ${this.props.selectedClassName}`}
        onClick={onClick}
        onMouseEnter={() => this.setState({ isHovered: true })}
        onMouseLeave={() => this.setState({ isHovered: false })}
      >
        {item.label}
        {item.subMenu && this.state.isHovered &&
          <ContextMenu
            onOptionSelected={this.props.onOptionSelected}
            options={item.subMenu}
            containerClass="subMenu"
          />
        }
      </li>
    );
  }
}

ContextMenuItem.propTypes = {
  item: PropTypes.object.isRequired,
  handleItemClick: PropTypes.func.isRequired,
  onOptionSelected: PropTypes.func.isRequired,
  style: PropTypes.object,
  selectedClassName: PropTypes.string,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
};
