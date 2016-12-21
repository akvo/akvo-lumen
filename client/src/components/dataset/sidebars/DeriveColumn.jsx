import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import CodeMirror from 'react-codemirror';
import esprima from 'esprima';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

require('codemirror/lib/codemirror.css');
require('codemirror/mode/javascript/javascript');
require('../../../styles/DeriveColumn.scss');


const typeOptions = [
  {
    label: 'Text',
    value: 'text',
  }, {
    label: 'Number',
    value: 'number',
  }, {
    label: 'Date',
    value: 'date',
  },
];

const errorStrategies = [
  {
    label: 'Leave cell empty',
    value: 'leave-empty',
  }, {
    label: 'Abort transformation',
    value: 'fail',
  }, {
    label: 'Delete row',
    value: 'delete-row',
  },
];

function isValidCode(code) {
  try {
    const ast = esprima.parse(code);
    if (ast.body.length !== 1) {
      return false;
    }
    const expressionStatement = ast.body[0];
    if (expressionStatement.type !== 'ExpressionStatement') {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default class DeriveColumn extends Component {
  constructor() {
    super();
    this.state = {
      transformation: Immutable.fromJS({
        op: 'core/derive',
        args: {
          newColumnTitle: '',
          newColumnType: 'text',
          code: '',
        },
        onError: 'leave-empty',
      }),
    };
  }

  setTransformationProperty(path, value) {
    const { transformation } = this.state;
    this.setState({
      transformation: transformation.setIn(path, value),
    });
  }

  isValidTransformation() {
    const { columns } = this.props;
    const { transformation } = this.state;
    const title = transformation.getIn(['args', 'newColumnTitle']);
    if (title.trim() === '') {
      return false;
    }
    if (columns.some(col => col.get('title') === title)) {
      return false;
    }
    return isValidCode(transformation.getIn(['args', 'code']));
  }

  render() {
    const { onClose, onApply /* columns */ } = this.props;
    const { transformation } = this.state;
    const args = transformation.get('args');
    return (
      <div
        className="DataTableSidebar"
        style={{
          width: '300px',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <SidebarHeader onClose={onClose}>
          Derive Column
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label htmlFor="code">
              Code
            </label>
            <CodeMirror
              value={args.get('code')}
              onChange={code => this.setTransformationProperty(['args', 'code'], code)}
              options={{
                mode: 'javascript',
              }}
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="titleTextInput"
            >
              New column title
            </label>
            <input
              value={args.get('newColumnTitle')}
              type="text"
              className="titleTextInput"
              onChange={evt =>
                this.setTransformationProperty(['args', 'newColumnTitle'], evt.target.value)
              }
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="typeSelectInput"
            >
              New column type
            </label>
            <SelectMenu
              name="columnName"
              value={args.get('newColumnType')}
              onChange={value => this.setTransformationProperty(['args', 'newColumnType'], value)}
              options={typeOptions}
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="errorStrategy"
            >
              If transformation fails
            </label>
            <SelectMenu
              name="errorStrategy"
              value={transformation.get('onError')}
              onChange={value => this.setTransformationProperty(['onError'], value)}
              options={errorStrategies}
            />
          </div>
        </div>
        <SidebarControls
          positiveButtonText="Derive"
          onApply={this.isValidTransformation() ? () => onApply(this.state.transformation) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

DeriveColumn.propTypes = {
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};
