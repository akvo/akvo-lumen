import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';
import { intlShape, FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import { filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

function SelectColumn({ columns, latOrLong, onChange, value, intl }) {
  const columnName = 'columnName'.concat(_.capitalize(latOrLong));
  const translationId = `select_column_${latOrLong}`;
  const cols = filterColumns(columns, ['number']);
  return (
    <div className="inputGroup">
      <label htmlFor={columnName}>
        <FormattedMessage id={translationId} />
      </label>
      <SelectMenu
        name={columnName}
        value={columnSelectSelectedOption(value, cols)}
        onChange={onChange}
        options={columnSelectOptions(intl, cols)}
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  latOrLong: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  intl: intlShape,
};

export default class GenerateGeopoints extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/generate-geopoints',
        args: {
          columnNameLat: null,
          columnNameLong: null,
          ColumnTitleGeo: '',
        },
        onError: 'fail',
      }),
    };
    this.handleSelectColumn = this.handleSelectColumn.bind(this);
    this.isValidTransformation = this.isValidTransformation.bind(this);
    this.handleChangeColumnTitleGeo = this.handleChangeColumnTitleGeo.bind(this);
  }

  handleSelectColumn(value, latOrLong) {
    const { transformation } = this.state;
    const columnName = 'columnName'.concat(_.capitalize(latOrLong));
    this.setState({
      transformation: transformation.setIn(['args', columnName], value),
    });
  }

  isValidTransformation() {
    const { transformation } = this.state;
    return transformation.getIn(['args', 'columnNameLat']) != null
      && transformation.getIn(['args', 'columnNameLong']) != null
      && transformation.getIn(['args', 'columnTitleGeo']) !== '';
  }

  handleChangeColumnTitleGeo(value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(['args', 'columnTitleGeo'], value),
    });
  }

  render() {
    const { onClose, onApply, columns, intl } = this.props;
    const args = this.state.transformation.get('args');
    const hasDataGroup = typeof columns.get(0) === 'string'; // group id in first position?
    const cols = hasDataGroup ? columns.get(1) : columns;
    return (
      <div
        className="DataTableSidebar"
      >
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="generate_geopoints" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={cols}
            latOrLong="lat"
            intl={intl}
            onChange={value => this.handleSelectColumn(value, 'lat')}
            value={args.get('columnNameLat')}
          />
          <SelectColumn
            columns={cols}
            latOrLong="long"
            intl={intl}
            onChange={value => this.handleSelectColumn(value, 'long')}
            value={args.get('columnNameLong')}
          />
          <div className="inputGroup">
            <label
              htmlFor="titleTextInput"
            >
              <FormattedMessage id="column_title_geo" />
            </label>
            <input
              value={args.get('columnTitleGeo') || ''}
              type="text"
              className="titleTextInput"
              data-test-id="columnTitle"
              onChange={evt => this.handleChangeColumnTitleGeo(evt.target.value)}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText={<FormattedMessage id="generate" />}
          onApply={this.isValidTransformation() ? () => onApply(this.state.transformation) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

GenerateGeopoints.propTypes = {
  columns: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  intl: intlShape,
};
