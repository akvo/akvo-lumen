import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';

export default function FilterColumns({ filter, intl, dataset, onFilterValueChange }) {
  const filterColumns = filter.columns;

  return filterColumns.map((o, idx) => {
    const columns = dataset && dataset.get('columns');
    if (columns) {
      const column = columns.find(x => x.get('columnName') === o.column);
      const columnVals = dataset.getIn(['columnsFetched', o.column]);
      const vals = columnVals ? columnVals.map(x => ({ label: x, value: x })) : [];
      const columnIndex = filter.columns.findIndex(x => x.column === o.column);
      return (
        <div style={{ paddingBottom: '10px', paddingRight: '1rem', display: 'inline-block' }} key={`div-filterColumn-${idx}`}>
          <span style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
            {column && column.get('title')}
          </span>
          <SelectMenu
            name="datasets"
            isClearable
            key={`filterColumn-${idx}`}
            width="200px"
            value={filter.columns[columnIndex].value}
            onChange={(id) => {
              const editedFilter = filter;
              editedFilter.columns[columnIndex].value = id;
              onFilterValueChange(editedFilter, true);
            }}
            options={vals}
            placeholder={intl.messages.all}
          />
        </div>);
    }
    return null;
  });
}

FilterColumns.propTypes = {
  intl: intlShape,
  filter: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  onFilterValueChange: PropTypes.func.isRequired,
};
