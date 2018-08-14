import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import ToggleInput from '../../common/ToggleInput';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';
import * as api from '../../../api';


function MultipleColumnImage(props) {
    const hasImage = props.multipleColumn ? props.multipleColumn.hasImage : null;
    console.log("hasImage",  hasImage);
  if (hasImage) {
      return <div><h1>extract image? {hasImage.toString()} </h1>
	   <ToggleInput
        name="image"
        type="checkbox"
        labelId="show_legend"
        className="showLegend"
      checked={false}
      onChange={null}
      /></div>
      ;
  }else{
      return <h1>NO IMAGE {hasImage.toString()}</h1>;
  }
}
function Column(props) {
    const value = props.value;
    const key = props.key;
    const type = props.type;
  return (
    // Wrong! There is no need to specify the key here:
    <li key={key}>
      {value} - {type}
    </li>
  );
}


function MultipleColumnList(props) {
    const columns = props.multipleColumn ? props.multipleColumn.columns : [];
    console.log("columns", columns);
    const columList = columns.map(column => <Column key={column.id} value={column.name} type={column.type} />);
    return (
	<ul>
	  {columList}
	</ul>
    );}


function textColumnOptions(columns) {
  return columns.filter(column =>
    (column.get('type') === 'multiple')
  ).map(column => ({
    label: column.get('title'),
    value: column.get('columnName'),
  })).toJS();
}

function getMultipleColumn(columns, value) {
  return columns.filter(column =>
	((column.get('type') === 'multiple') && (column.get('columnName') === value))
  ).toJS()[0];
}


function SelectColumn({ columns, idx, onChange, value }) {
  return (
    <div className="inputGroup">
      <label
        htmlFor="columnName"
      >
        <FormattedMessage
          id="select_n_column"
          values={{ idx }}
        />
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

export default class ExtractMultiple extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/extract-multiple',
        args: {
          columnName: ''
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
	console.log("column:",column);
	api.get('/api/multiple-column', {
            query: JSON.stringify({subtype: column.subtype, subtypeId: column.subtypeId}),
        })
       .then(response => response.json())
	    .then(multipleColumns => this.setState({multipleColumn:multipleColumns}));
  }


    handleSelectColumn(columns, value) {
	const { transformation } = this.state;
	this.getPossibleColumns(getMultipleColumn(columns, value));
	this.setState({transformation: transformation.setIn(['args', 'columnName'], value),});
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
	    <MultipleColumnImage multipleColumn={this.state.multipleColumn}/>
	    <MultipleColumnList multipleColumn={this.state.multipleColumn}/>
        </div>

        <SidebarControls
          positiveButtonText={<FormattedMessage id="extract" />}
          onApply={this.isValidTransformation() ? () => onApply(this.state.transformation) : null}
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
