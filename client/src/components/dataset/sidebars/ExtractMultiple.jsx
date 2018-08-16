import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import ToggleInput from '../../common/ToggleInput';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import * as api from '../../../api';

function textColumnOptions(columns) {
  return columns
    .filter(column => column.get('type') === 'multiple')
    .map(column => ({
      label: column.get('title'),
      value: column.get('columnName'),
    }))
    .toJS();
}

function getMultipleColumn(columns, value) {
  return columns
    .filter(
      column =>
        column.get('type') === 'multiple' && column.get('columnName') === value,
    )
    .toJS()[0];
}

function SelectColumn({ columns, idx, onChange, value }) {
  return (
    <div className="inputGroup">
      <label htmlFor="columnName">
        <FormattedMessage id="select_n_column" values={{ idx }} />
      </label>
      <SelectMenu
        name="columnName"
        value={value}
        onChange={onChange}
        options={textColumnOptions(columns)}
      />
    </div>
  );
}

SelectColumn.propTypes = {
  columns: PropTypes.object.isRequired,
  idx: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

class MultipleColumnImage extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.state = { transformation: this.props.transformation };
  }
  onChange(value) {
    this.setState({
      transformation: this.state.transformation.setIn(['args', 'image'], value),
    });
  }
  render() {
    const hasImage = this.props.multipleColumn.hasImage;
    const extractImage = this.state.transformation.getIn(['args', 'image']);
    if (hasImage) {
      return (
        <div>
          <FormattedMessage id="extract_image" />
          <ToggleInput
            name="image"
            type="checkbox"
            labelId="extract_image"
            className="showLegend"
            checked={extractImage}
            onChange={this.onChange}
          />
        </div>
      );
    }
    return null;
  }
}

class Column extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const value = this.props.value;
    const type = this.props.type;
    const id = this.props.id;
    return (
      <div key={id}>
        {/* <ToggleInput
            name="extractColumn"
            type="checkbox"
            labelId="extract_column"
            className="showLegend"
            checked={extractColumn}
            onChange={this.onChange}
            /> */}
        {value} - {type}
      </div>
    );
  }
}

class MultipleColumnList extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const columns = this.props.multipleColumn.columns || [];
    const columList = columns.map(column => (
      <Column key={column.id} value={column.name} type={column.type} />
    ));
    return <div>{columList}</div>;
  }
}

class MultipleColumn extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const multipleColumn = this.props.multipleColumn;
    const transformation = this.props.transformation;
    return multipleColumn ? (
      <div>
        <MultipleColumnImage
          multipleColumn={multipleColumn}
          transformation={transformation}
        />
        <MultipleColumnList multipleColumn={multipleColumn} />
      </div>
    ) : null;
  }
}

export default class ExtractMultiple extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/extract-multiple',
        args: {
          image: false,
          columnName: '',
        },
        onError: 'fail',
      }),
    };
  }

  isValidTransformation() {
    const { transformation } = this.state;
    return transformation.getIn(['args', 'columnName']) !== '';
  }

  getPossibleColumns(column) {
    console.log('column:', column);
    api
      .get('/api/multiple-column', {
        query: JSON.stringify({
          subtype: column.subtype,
          subtypeId: column.subtypeId,
        }),
      })
      .then(response => response.json())
      .then(multipleColumns =>
        this.setState({ multipleColumn: multipleColumns }),
      );
  }

  handleSelectColumn(columns, value) {
    const { transformation } = this.state;
    this.getPossibleColumns(getMultipleColumn(columns, value));
    this.setState({
      transformation: transformation.setIn(['args', 'columnName'], value),
    });
  }

  render() {
    const { onClose, onApply, columns } = this.props;
    const args = this.state.transformation.get('args');
    console.log(this.state);
    return (
      <div className="DataTableSidebar">
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="extract_multiple" />
        </SidebarHeader>
        <div className="inputs">
          <SelectColumn
            columns={columns}
            idx={1}
            onChange={value => this.handleSelectColumn(columns, value)}
            value={args.get('columnName')}
          />
          <MultipleColumn
            multipleColumn={this.state.multipleColumn}
            transformation={this.state.transformation}
          />
        </div>

        <SidebarControls
          positiveButtonText={<FormattedMessage id="extract" />}
          onApply={
            this.isValidTransformation()
              ? () => onApply(this.state.transformation)
              : null
          }
          onClose={onClose}
        />
      </div>
    );
  }
}

ExtractMultiple.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};
