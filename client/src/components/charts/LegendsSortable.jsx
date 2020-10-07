import React from 'react';
import PropTypes from 'prop-types';
import {
  SortableContainer,
  sortableElement,
  sortableHandle,
} from 'react-sortable-hoc';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import arrayMove from 'array-move';

import { sortAlphabetically, sortChronologically } from '../../utilities/utils';
import { palette } from '../../utilities/visualisationColors';
import LegendShape from './LegendShape';

// HELPER FUNCTIONS
// eslint-disable-next-line no-confusing-arrow
export const sortLegendsFunctionFactory = data =>
  get(data, 'data.common.metadata.type') === 'text' || get(data, 'data.common.metadata.type') === 'option'
  ? sortAlphabetically
  : sortChronologically;


const sortableItemStyle = {
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'row',
  margin: '5px 0px 5px 5px',
};

const visLegendsListFun = (visualisation, hasSubbucket) =>
    get(visualisation, hasSubbucket ? 'data.series' : 'data.common.data') || [];

const getLegends = (specLegend, visualisation, hasSubbucket, noSort) => {
  const specLegendsList = get(specLegend, 'order.list') || [];
  const visLegendsList = visLegendsListFun(visualisation, hasSubbucket);
  const noChanged = isEqual(
    new Set(specLegendsList),
    new Set(visLegendsList.map(l => l.key))
  );
  if (noChanged && (get(specLegend, 'order.mode') !== 'auto')) {
    return specLegendsList;
  }
  const legends = noChanged
        ? specLegendsList
        : visLegendsList
        .map(l => l.key);
  return noSort ? legends : legends.slice().sort(sortLegendsFunctionFactory(visualisation));
};

// ensure spec legend has order object
export const ensureSpecLegend = (specLegend) => {
  const defaultOrder = { mode: 'auto', list: [] };
  const legend = { ...specLegend } || { order: defaultOrder };
  const order = legend.order || defaultOrder;
  legend.order = order;
  return legend;
};

export const resetLegend = (specLegend, visualisation, val, hasSubbucket, noSort) => {
  const legend = ensureSpecLegend(specLegend);
  const legends = getLegends(legend, visualisation, hasSubbucket, noSort);
  if (val) {
    legend.order.mode = val;
    if (val === 'auto') {
      if (noSort) {
        legend.order.list = visLegendsListFun(visualisation, hasSubbucket).map(({ key }) => key);
      } else {
        legend.order.list = legends.slice().sort(
          sortLegendsFunctionFactory(visualisation)
        );
      }
    }
  } else {
    return resetLegend(specLegend, visualisation, 'auto', hasSubbucket, noSort);
  }
  return legend;
};

export const noSortFunc = () => 1;

export const sortLegendListFunc = (defaultSortFunction, specLegend) => {
  if (specLegend.order.mode === 'custom') {
    return (list) => {
      if (
        isEqual(
          new Set(specLegend.order.list),
          new Set(list.map(({ key }) => key))
        )
      ) {
        // if bucket column changes we need to get the new spec api call returned
        // before sorting new values
        return specLegend.order.list.map(k =>
          list.find(({ key }) => k === key)
        );
      }
      return list.slice().sort((a, b) => defaultSortFunction(a, b, ({ key }) => key));
    };
  }
  return list =>
    list.slice().sort((a, b) => defaultSortFunction(a, b, ({ key }) => key));
};


// SORT ITEMS
const NoSortableItem = ({ value, color }) => (
  <div style={sortableItemStyle} key={`item-${value}`}>
    <LegendShape fill={color} />
    <div style={{ marginLeft: '4px' }}>{value}</div>
  </div>
);

NoSortableItem.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
  ]),
  color: PropTypes.string.isRequired,
};


const DragHandle = sortableHandle(() => (
  <div style={{ marginRight: '4px', cursor: 'pointer' }}>
    <span>::</span>
  </div>
));
const SortableItem = sortableElement(({ index, value, color }) => (
  <div style={sortableItemStyle}>
    <DragHandle index={index} key={value} />
    <LegendShape fill={color} />
    <div style={{ marginLeft: '4px' }}>{value}</div>
  </div>
));

SortableItem.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
  ]),
  index: PropTypes.number.isRequired,
};


// MAIN COMPONENT
export const LegendsSortable = ({
  onChangeSpec,
  colors,
  specLegend,
  visualisation,
  hasSubbucket,
  noSort,
}) => {
  const legendColors = React.useRef({});
  const legendColorsCount = React.useRef(0);
  const sortable = (get(specLegend, 'order.mode') || 'auto') === 'custom';
  const legends = getLegends(specLegend, visualisation, hasSubbucket, noSort);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const currentItems = arrayMove(legends, oldIndex, newIndex);
    const legend = ensureSpecLegend(specLegend);
    legend.order.list = currentItems;
    onChangeSpec({ legend });
  };

  const getColor = (key) => {
    if (colors && colors[key]) {
      return colors[key];
    }

    if (legendColors.current[key]) {
      return legendColors.current[key];
    }

    legendColors.current[key] = palette[legendColorsCount.current];
    legendColorsCount.current += 1;
    return legendColors.current[key];
  };

  // eslint-disable-next-line new-cap
  const SortableList = SortableContainer(({ legendItems }) => (
    <div style={{ marginBottom: '5px' }}>
      {sortable
        ? legendItems &&
          legendItems.map(value => (
            <SortableItem
              key={`item-${value}`}
              value={value}
              index={legends.indexOf(value)}
              color={getColor(value)}
            />
          ))
        : legendItems &&
          legendItems.map(value => (
            <NoSortableItem
              value={value}
              key={`item-${value}`}
              color={getColor(value)}
            />
          ))}
    </div>
  ));

  return <SortableList onSortEnd={onSortEnd} legendItems={legends} />;
};

LegendsSortable.propTypes = {
  visualisation: PropTypes.object.isRequired,
  colors: PropTypes.object,
  onChangeSpec: PropTypes.func.isRequired,
  specLegend: PropTypes.object.isRequired,
  hasSubbucket: PropTypes.bool,
  noSort: PropTypes.bool,
};
