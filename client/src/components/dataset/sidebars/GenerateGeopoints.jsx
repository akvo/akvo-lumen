import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function numberColumnOptions(columns) {
  return columns.filter(column =>
    column.get('type') === 'number'
  ).map(column => ({
    label: column.get('title'),
    value: column.get('columnName'),
  })).toJS();
}

function SelectColumn({ columns, latOrLong, onChange, value }) {
  const columnName = 'columnName'.concat(_.capitalize(latOrLong));
  const translationId = `select_column_${latOrLong}`;
  return (
    <div className="inputGroup">
      <label htmlFor={columnName}>
        <FormattedMessage id={translationId} />
      </label>
      <SelectMenu
        name={columnName}
        value={value}
        onChange={onChange}
        options={numberColumnOptions(columns)}
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  latOrLong: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
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
    const { onClose, onApply, columns } = this.props;
    const args = this.state.transformation.get('args');
    return (
      <div
        className="DataTableSidebar"
      >
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="generate_geopoints" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={columns}
            latOrLong="lat"
            onChange={value => this.handleSelectColumn(value, 'lat')}
            value={args.get('columnNameLat')}
          />
          <SelectColumn
            columns={columns}
            latOrLong="long"
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
};
