import React from 'react';
import PropTypes from 'prop-types';
import SelectMenu from '../../common/SelectMenu';

export default function FilterColumns({ filter, dataset }) {
  return filter.columns.map((o, idx) => {
    const columns = dataset && dataset.get('columns');
    if (columns) {
      const column = columns.find(x => x.get('columnName') === o);
      const columnVals = dataset.getIn(['columnsFetched', o]);
      const vals = columnVals ? columnVals.map(x => ({ label: x, value: x })) : [];
      return (
        <div style={{ paddingBottom: '10px' }} key={`div-filterColumn-${idx}`}>
          <span style={{ fontWeight: 'bold' }}>{column.get('title')}</span>
          <SelectMenu
            name="datasets"
            isClearable
            key={`filterColumn-${idx}`}
            width="200px"
            onChange={(id) => {
              // eslint-disable-next-line no-console
              console.log('selecting', id, 'column', o);
            }}
            options={vals}
          />
        </div>);
    }
    return null;
  });
}

FilterColumns.propTypes = {
  filter: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
};
