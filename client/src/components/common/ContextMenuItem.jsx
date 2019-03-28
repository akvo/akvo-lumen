import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';

export default class ContextMenuItem extends Component {
  constructor() {
    super();
    this.state = {
      isHovered: false,
    };
  }

  render() {
    const { item } = this.props;
    const onClick = item.subMenu ? null : (event) => {
      event.stopPropagation();
      this.props.handleItemClick(item.value);
      if (this.props.onWindowClick) {
        this.props.onWindowClick();
      }
    };

    return (
      <li
        className={`contextMenuItem ${
          this.props.itemClass || ''
        } ${
          item.disabled ? 'contextMenuItem-disabled' : 'clickable'
        } ${
          this.props.selectedClassName || ''
        } ${
          this.props.customClass || ''
        }`}
        onClick={item.disabled ? () => {} : onClick}
        data-test-id={item.value}
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
  onWindowClick: PropTypes.func,
  onOptionSelected: PropTypes.func.isRequired,
  style: PropTypes.object,
  selectedClassName: PropTypes.string,
  containerClass: PropTypes.string,
  itemClass: PropTypes.string,
  customClass: PropTypes.string,
};
