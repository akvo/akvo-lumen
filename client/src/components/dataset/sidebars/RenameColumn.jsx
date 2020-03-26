import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import { FormattedMessage } from 'react-intl';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

function trim(transformation) {
  return transformation.updateIn(['args', 'newColumnTitle'], title => title.trim());
}

export default class RenameColumn extends Component {
  constructor(props) {
    super(props);
    const x = {
      transformation: Immutable.fromJS({
        op: 'core/rename-column',
        args: {
          columnName: props.column.get('columnName'),
          newColumnTitle: props.column.get('title'),
        },
        onError: 'fail',
      }),
    };
    this.state = x;
  }

  isValidTransformation() {
    const { transformation } = this.state;
    return transformation.getIn(['args', 'newColumnTitle']).trim() !== '';
  }

  handleChangeNewColumnTitle(value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(['args', 'newColumnTitle'], value),
    });
  }

  render() {
    const { onClose, onApply } = this.props;
    const { transformation } = this.state;
    const args = transformation.get('args');
    return (
      <div
        className="DataTableSidebar"
      >
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="rename_column" />
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label htmlFor="titleTextInput">
              <FormattedMessage id="new_column_title" />
            </label>
            <input
              value={args.get('newColumnTitle')}
              type="text"
              className="titleTextInput"
              onChange={evt => this.handleChangeNewColumnTitle(evt.target.value)}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText={<FormattedMessage id="rename" />}
          onApply={this.isValidTransformation() ? () => onApply(trim(transformation)) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

RenameColumn.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  column: PropTypes.object.isRequired,
};
