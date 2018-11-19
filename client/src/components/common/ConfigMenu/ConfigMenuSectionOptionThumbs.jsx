import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ScrollBar from '../ScrollBar';
import ConfigMenuSectionOption from './ConfigMenuSectionOption';
import './ConfigMenuSectionOptionThumbs.scss';

const scrollTo = (container, to) => {
  const toElement = document.getElementsByName(to)[0];
  if (!toElement) {
    console.warn('scroll target not found', to); // eslint-disable-line
    return null;
  }
  container.scrollLeft = toElement.offsetLeft; // eslint-disable-line
  return toElement.offsetLeft;
};

class ConfigMenuSectionOptionThumbs extends Component {
  constructor(props) {
    super(props);
    this.id = 'ConfigMenuSectionThumbs-xyz';
  }

  componentDidMount() {
    const selectedItem = this.props.items.filter(({ selected }) => selected)[0];
    if (!selectedItem) return;
    setTimeout(() => {
      const offsetLeft = scrollTo(this.scrollContainer.getElement(), `${this.id}-${selectedItem.label}`);
      this.scrollContainer.scrollTo(offsetLeft);
    }, 100);
  }

  render() {
    const { items, labelTextId } = this.props;
    return (
      <ConfigMenuSectionOption labelTextId={labelTextId}>
        <ScrollBar ref={(c) => { this.scrollContainer = c; }}>
          {items.map(({ imageSrc, label, selected, onClick, testId }) => (
            <a
              className={`ConfigMenuSectionOptionThumb ${
                selected ? 'ConfigMenuSectionOptionThumb--selected' : ''
              }`}
              onClick={onClick}
              data-test-id={testId}
              name={`${this.id}-${label}`}
              key={label}
            >
              <img src={imageSrc} alt={label} />
              <h4>{label}</h4>
            </a>
          ))}
        </ScrollBar>
      </ConfigMenuSectionOption>
    );
  }
}

ConfigMenuSectionOptionThumbs.propTypes = {
  items: PropTypes.array.isRequired,
  labelTextId: PropTypes.string,
  testId: PropTypes.string,
};

export default ConfigMenuSectionOptionThumbs;
