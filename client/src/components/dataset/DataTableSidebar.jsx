import React, { PropTypes } from 'react';
import ChangeDataType from './sidebars/ChangeDataType';
import Filter from './sidebars/Filter';
import TransformationLog from './sidebars/TransformationLog';
import CombineColumns from './sidebars/CombineColumns';
import DeriveColumn from './sidebars/DeriveColumn';

require('../../styles/DataTableSidebar.scss');

export default function DataTableSidebar(props) {
  switch (props.type) {
    case 'edit':
      return <ChangeDataType {...props} />;
    case 'filter':
      return <Filter {...props} />;
    case 'transformationLog':
      return <TransformationLog {...props} />;
    case 'combineColumns':
      return <CombineColumns {...props} />;
    case 'deriveColumn':
      return <DeriveColumn {...props} />;
    default:
      throw new Error(`Unknown sidebar type ${props.type}`);
  }
}

DataTableSidebar.propTypes = {
  type: PropTypes.oneOf(
    [
      'edit',
      'filter',
      'transformationLog',
      'combineColumns',
      'deriveColumn',
    ]
  ).isRequired,
  onClose: PropTypes.func.isRequired,
};
