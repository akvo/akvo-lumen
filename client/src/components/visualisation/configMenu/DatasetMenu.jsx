import React from 'react';
import PropTypes from 'prop-types';

import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';

const DatasetMenu = ({ visualisation, options, onChange, children }) => (
  <ConfigMenuSection
    title="dataset"
    options={(
      <ConfigMenuSectionOptionSelect
        id="source_dataset"
        name="xDatasetMenu"
        placeholderId="choose_dataset"
        value={visualisation.datasetId !== null ? visualisation.datasetId.toString() : null}
        options={options}
        onChange={onChange}
      />
    )}
  >
    {children}
  </ConfigMenuSection>
);

DatasetMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  children: PropTypes.node,
  options: PropTypes.array,
  onChange: PropTypes.func.isRequired,
};

export default DatasetMenu;
