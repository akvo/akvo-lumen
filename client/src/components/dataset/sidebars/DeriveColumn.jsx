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

function Code({ children }) {
  return (
    <code>
      {children}
    </code>
  );
}

Code.propTypes = {
  children: PropTypes.string.isRequired,
};

function HelpText() {
  return (
    <div className="HelpText">
      Derived columns are formulas written using a subset of Javascript where a single expression
      is allowed and columns are referenced as <Code>{'row["Column Title"]'}</Code> or
      alternatively if the title is a valid javascript identifier: <Code>row.title</Code>.
    </div>
  );
}

function HelpTextToggleButton({ onClick }) {
  return (
    <button
      className="HelpTextToggleButton clickable noSelect"
      onClick={onClick}
    >
      ?
    </button>
  );
}

HelpTextToggleButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

class CodeFeedback extends Component {
  constructor() {
    super();
    this.state = {
      showHelpText: false,
    };
  }

  toggleShowHelpText() {
    this.setState({ showHelpText: !this.state.showHelpText });
  }

  render() {
    const { code } = this.props;
    return (
      <div className="CodeFeedback">
        <div
          className="container"
        >
          <span className="feedbackMessage">
            {code.trim() === '' || isValidCode(code) ?
              '' :
              'Invalid expression'}
          </span>
          <span>
            <HelpTextToggleButton onClick={() => this.toggleShowHelpText()} />
          </span>
        </div>
        {this.state.showHelpText && <HelpText />}
      </div>
    );
  }
}

CodeFeedback.propTypes = {
  code: PropTypes.string.isRequired,
};

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
    const code = args.get('code');
    return (
      <div
        className="DataTableSidebar DeriveColumn"
      >
        <SidebarHeader onClose={onClose}>
          Derive Column
        </SidebarHeader>
        <div className="inputs">
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
          <div className="inputGroup">
            <label htmlFor="code">
              Javascript code
            </label>
            <CodeMirror
              placeholder="type javascript expression here"
              value={code}
              onChange={c => this.setTransformationProperty(['args', 'code'], c)}
              options={{
                mode: 'javascript',
              }}
            />
            <CodeFeedback code={code} />
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
