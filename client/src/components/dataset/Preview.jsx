import React, { Component, PropTypes } from 'react';
import { Table, Column, Cell } from 'fixed-data-table';
import PreviewHeader from './PreviewHeader';

export default class Preview extends Component {

  constructor() {
    super();
    this.state = { width: 1024 };
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
    this.setState({ width: this.refs.wrappingDiv.clientWidth });
  }

  render() {
    const cols = this.props.columns.map((column) => (
      <Column
        header={<PreviewHeader title={column.title} />}
        cell={props => <Cell>{column.values[props.rowIndex]}</Cell>}
        width={200} />
    ));

    return (
      <div className="Preview" ref="wrappingDiv">
        <Table
          headerHeight={50}
          rowHeight={30}
          rowsCount={this.props.columns[0].values.length}
          width={this.state.width}
          height={300}>
          {cols}
        </Table>
      </div>
    );
  }
}

Preview.propTypes = {
  columns: PropTypes.array.isRequired,
};
