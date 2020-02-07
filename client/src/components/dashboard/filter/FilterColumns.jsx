import React from 'react';
import PropTypes from 'prop-types';
import SelectMenu from '../../common/SelectMenu';
import { FormattedMessage } from 'react-intl';

export default function FilterColumns({ filter, dataset, onFilterChange }) {
  return filter.columns.map((o, idx) => {
    const columns = dataset && dataset.get('columns');
    if (columns) {
      const column = columns.find(x => x.get('columnName') === o.column);
      const columnVals = dataset.getIn(['columnsFetched', o.column]);
      const vals = columnVals ? columnVals.map(x => ({ label: x, value: x })) : [];
      const columnIndex = filter.columns.findIndex(x => x.column === o.column);
      return (
        <div style={{ paddingBottom: '10px' }} key={`div-filterColumn-${idx}`}>
          <span style={{ fontWeight: 'bold' }}>{column && column.get('title')}</span>
          <SelectMenu
            name="datasets"
            isClearable
            key={`filterColumn-${idx}`}
            width="200px"
            value={filter.columns[columnIndex].value}
            onChange={(id) => {
              const editedFilter = filter;
              editedFilter.columns[columnIndex].value = id;
              onFilterChange(editedFilter, true);
            }}
            options={vals}
            placeholder={<FormattedMessage id="all" />}
          />
        </div>);
    }
    return null;
  });
}

FilterColumns.propTypes = {
  filter: PropTypes.object.isRequired,
  dataset: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
};
