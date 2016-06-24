import React, { PropTypes } from 'react';
import ChangeDataType from './sidebars/ChangeDataType';
import Filter from './sidebars/Filter';
import TransformationLog from './sidebars/TransformationLog';

require('../../styles/DataTableSidebar.scss');

export default function DataTableSidebar(props) {
  switch (props.type) {
    case 'edit':
      return <ChangeDataType {...props} />;
    case 'filter':
      return <Filter {...props} />;
    case 'transformationLog':
      return <TransformationLog {...props} />;
    default:
      throw new Error(`Unknown sidebar type ${props.type}`);
  }
}

DataTableSidebar.propTypes = {
  type: PropTypes.oneOf(['edit', 'filter', 'transformationLog']).isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};
