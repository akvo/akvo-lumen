import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import ChangeDataType from './sidebars/ChangeDataType';
import Filter from './sidebars/Filter';
import TransformationLog from './sidebars/TransformationLog';
import CombineColumns from './sidebars/CombineColumns';
import ExtractMultiple from './sidebars/ExtractMultiple';
import SplitColumn from './sidebars/SplitColumn';
import DeriveColumnJavascript from './sidebars/DeriveColumnJavascript';
import RenameColumn from './sidebars/RenameColumn';
import GenerateGeopoints from './sidebars/GenerateGeopoints';

require('./DataTableSidebar.scss');

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
    case 'extractMultiple':
      return <ExtractMultiple {...props} />;
    case 'splitColumn':
      return <SplitColumn {...props} />;
    case 'deriveColumnJavascript':
      return <DeriveColumnJavascript {...props} />;
    case 'renameColumn':
      return <RenameColumn {...props} />;
    case 'generateGeopoints':
      return <GenerateGeopoints {...props} />;
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
      'extractMultiple',
      'splitColumn',
      'deriveColumnJavascript',
      'renameColumn',
      'generateGeopoints',
    ]
  ).isRequired,
  onClose: PropTypes.func.isRequired,
  intl: intlShape,
};
