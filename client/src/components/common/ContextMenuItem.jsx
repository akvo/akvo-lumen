import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';

export default class ContextMenuItem extends Component {

  static defaultProps = {
    itemClass: '',
    selectedClassName: '',
    customClass: '',
  };

  constructor() {
    super();
    this.state = {
      isHovered: false,
    };
  }

  render() {
    const {
      item,
      itemClass,
      selectedClassName,
      customClass,
      handleItemClick,
      onWindowClick,
      onOptionSelected,
    } = this.props;

    const onClick = item.subMenu ? null : (event) => {
      event.stopPropagation();
      handleItemClick(item.value);
      if (onWindowClick) {
        onWindowClick();
      }
    };

    const classNames = [
      'contextMenuItem',
      itemClass,
      selectedClassName,
      customClass,
    ];

    if (item.disabled) {
      classNames.push('contextMenuItem-disabled');
    } else {
      classNames.push('clickable');
    }

    if (item.subMenu) {
      classNames.push('contextMenuItem-with-submenu');
    }

    return (
      <li
        className={classNames.join(' ')}
        onClick={item.disabled ? () => {} : onClick}
        data-test-id={item.value}
        onMouseEnter={() => this.setState({ isHovered: true })}
        onMouseLeave={() => this.setState({ isHovered: false })}
      >
        {item.label}
        {item.subMenu && this.state.isHovered &&
          <ContextMenu
            onOptionSelected={onOptionSelected}
            options={item.subMenu}
            containerClass="subMenu"
          />
        }
        <i className="fa fa-caret-right caret" />
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
