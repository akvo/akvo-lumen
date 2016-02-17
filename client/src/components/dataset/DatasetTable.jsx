import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';

require('../../styles/DatasetTable.scss');

export default class DatasetTable extends Component {

  constructor() {
    super();
    this.state = { width: 1024, height: 800 };
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize() {
    this.setState({
      width: this.refs.wrappingDiv.clientWidth,
      height: this.refs.wrappingDiv.clientHeight,
    });
  }

  render() {
    const cols = this.props.columns.map((column) => (
      <Column
        header={column.title}
        cell={props => <Cell>{column.values[props.rowIndex]}</Cell>}
        width={200}/>
    ));

    return (
      <div
        className="DatasetTable"
        ref="wrappingDiv">
        <Table
          headerHeight={50}
          rowHeight={30}
          rowsCount={this.props.columns[0].values.length}
          width={this.state.width}
          height={this.state.height}>
          {cols}
        </Table>
      </div>
    );
  }
}

DatasetTable.propTypes = {
  columns: PropTypes.array.isRequired,
};
