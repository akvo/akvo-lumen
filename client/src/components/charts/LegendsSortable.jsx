import React from 'react';
import PropTypes from 'prop-types';
import { SortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';

import { palette } from '../../utilities/visualisationColors';
import LegendShape from './LegendShape';

const sortableItemStyle = { display: 'flex', alignItems: 'center', flexDirection: 'row', margin: '5px 0px 5px 5px' };

const NoSortableItem = ({ value, color }) =>
(<div style={sortableItemStyle} key={`item-${value}`} >
  <LegendShape fill={color} />
  <div style={{ marginLeft: '4px' }}>{value}</div>
</div>);

const DragHandle = sortableHandle(() => <div style={{ marginRight: '4px' }}><span>::</span></div>);

const SortableItem = sortableElement(({ index, value, color }) =>
   (<div style={sortableItemStyle}>
     <DragHandle index={index} key={value} />
     <LegendShape fill={color} />
     <div style={{ marginLeft: '4px' }}>{value}</div></div>));

const LegendsSortable = ({
  onSortEnd,
  sortable,
  legends,
  colors,
}) => {
  const getColor = (key, index) => (colors && colors[key]) || palette[index];

  // eslint-disable-next-line new-cap
  const SortableList = SortableContainer(({ legendItems }) =>
  (
    <div style={{ marginBottom: '5px' }}>
      {legendItems.map((value, index) =>
        (sortable ?
          <SortableItem key={`item-${value}`} value={value} index={legends.indexOf(value)} color={getColor(value, index)} /> :
          <NoSortableItem value={value} key={`item-${value}`} color={getColor(value, index)} />
          )
      )}
    </div>
  )
);

  return (
    <SortableList
      onSortEnd={onSortEnd} legendItems={legends}
    />

  );
};
NoSortableItem.propTypes = {
  value: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
};
SortableItem.propTypes = {
  value: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

LegendsSortable.propTypes = {
  legends: PropTypes.array.isRequired,
  colors: PropTypes.object.isRequired,
  onSortEnd: PropTypes.func.isRequired,
  sortable: PropTypes.bool.isRequired,
};

export default LegendsSortable;
