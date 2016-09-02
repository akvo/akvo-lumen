import React, { PropTypes } from 'react';
import SelectMenu from '../common/SelectMenu';

const options = [
  { value: 'dataset', label: 'Dataset' },
  { value: 'visualisation', label: 'Visualisation' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'collection', label: 'Collection' },
];

export default function LibraryCreateButton({ onCreate }) {
  return (
    <div className="LibraryCreateButton">
      <SelectMenu
        name="create-button"
        options={options}
        onChange={onCreate}
        placeholder="New"
      />
    </div>
  );
}

LibraryCreateButton.propTypes = {
  onCreate: PropTypes.func.isRequired,
};
