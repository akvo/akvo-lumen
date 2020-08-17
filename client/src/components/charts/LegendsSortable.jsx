import React from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import isEqual from 'lodash/isEqual';
import get from 'lodash/get';
import arrayMove from 'array-move';

import { sortAlphabetically, sortChronologically } from '../../utilities/utils';
import { palette } from '../../utilities/visualisationColors';
import LegendShape from './LegendShape';

export const sortLegendsFunctionFactory = data => (get(data, 'data.common.metadata.type') === 'text' ?
  sortAlphabetically : sortChronologically);

const sortableItemStyle = { display: 'flex', alignItems: 'center', flexDirection: 'row', margin: '5px 0px 5px 5px' };

const NoSortableItem = ({ value, color }) =>
(<div style={sortableItemStyle} key={`item-${value}`} >
  <LegendShape fill={color} />
  <div style={{ marginLeft: '4px' }}>{value}</div>
</div>);

NoSortableItem.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isrequires]),
  color: PropTypes.string.isRequired,
};

const DragHandle = sortableHandle(() => <div style={{ marginRight: '4px' }}><span>::</span></div>);

const SortableItem = sortableElement(({ index, value, color }) =>
   (<div style={sortableItemStyle}>
     <DragHandle index={index} key={value} />
     <LegendShape fill={color} />
     <div style={{ marginLeft: '4px' }}>{value}</div></div>));

SortableItem.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isrequires]),
  index: PropTypes.number.isRequired,
};

const getLegends = (specLegend, visualisation) => {
  const specLegendsList = get(specLegend, 'order.list') || [];

  const visLegendsList = get(visualisation, 'data.common.data') || [];

  return isEqual(new Set(specLegendsList), new Set(visLegendsList.map(l => l.key))) ?
  specLegendsList : visLegendsList.map(l => l.key).sort(sortLegendsFunctionFactory(visualisation));
};

// ensure spec legend has order object
export const ensureSpecLegend = (specLegend) => {
  const legend = { ...specLegend } || {};
  const order = { ...legend.order } || {};
  legend.order = order;
  return legend;
};

export const LegendsSortable = ({
  onChangeSpec,
  colors,
  specLegend,
  visualisation,
}) => {
  const sortable = (get(specLegend, 'order.mode') || 'auto') === 'custom';
  const legends = getLegends(specLegend, visualisation);

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const currentItems = arrayMove(legends, oldIndex, newIndex);
    const legend = ensureSpecLegend(specLegend);
    legend.order.list = currentItems;
    onChangeSpec({ legend });
  };

  const getColor = (key, index) => (colors && colors[key]) || palette[index];

  // eslint-disable-next-line new-cap
  const SortableList = SortableContainer(({ legendItems }) =>
  (
    <div style={{ marginBottom: '5px' }}>
      {sortable ?
      legendItems && legendItems.map((value, index) =>
        <SortableItem key={`item-${value}`} value={value} index={legends.indexOf(value)} color={getColor(value, index)} />) :
      legendItems && legendItems.map((value, index) =>
        <NoSortableItem value={value} key={`item-${value}`} color={getColor(value, index)} />)
      }
    </div>
  )
);

  return (
    <SortableList
      onSortEnd={onSortEnd} legendItems={legends}
    />);
};

LegendsSortable.propTypes = {
  visualisation: PropTypes.object.isRequired,
  colors: PropTypes.object,
  onChangeSpec: PropTypes.func.isRequired,
  specLegend: PropTypes.object.isRequired,
};

export const resetLegend = (specLegend, visualisation, val) => {
  const legend = ensureSpecLegend(specLegend);
  const legends = getLegends(legend, visualisation);
  if (val) {
    legend.order.mode = val;
    if (val === 'auto') {
      legend.order.list = legends.sort(sortLegendsFunctionFactory(visualisation));
    }
  } else {
    return resetLegend(specLegend, visualisation, 'auto');
  }
  return legend;
};

export const noSortFunc = () => 1;

export const sortLegendListFunc = (defaultSortFunction, specLegend) => {
  if (specLegend.order.mode === 'custom') {
    return (list) => {
      if (isEqual(new Set(specLegend.order.list), new Set(list.map(({ key }) => key)))) {
        // if bucket column changes we need to get the new spec api call returned
        // before sorting new values
        return specLegend.order.list.map(k => list.find(({ key }) => k === key));
      }
      return list.sort((a, b) => defaultSortFunction(a, b, ({ key }) => key));
    };
  }
  return list => list.sort((a, b) => defaultSortFunction(a, b, ({ key }) => key));
};
