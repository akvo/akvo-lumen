import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import Immutable from 'immutable';
import CodeMirror from 'react-codemirror';
import esprima from 'esprima';
import SelectMenu from '../../common/SelectMenu';
import SidebarHeader from './SidebarHeader';
import SidebarControls from './SidebarControls';

require('codemirror/lib/codemirror.css');
require('codemirror/mode/javascript/javascript');
require('./DeriveColumnJavascript.scss');


const typeOptions = [
  {
    label: <FormattedMessage id="text" />,
    value: 'text',
  }, {
    label: <FormattedMessage id="number" />,
    value: 'number',
  }, {
    label: <FormattedMessage id="date" />,
    value: 'date',
  },
];

const errorStrategies = [
  {
    label: <FormattedMessage id="leave_cell_empty" />,
    value: 'leave-empty',
  }, {
    label: <FormattedMessage id="abort_transformation" />,
    value: 'fail',
  }, {
    label: <FormattedMessage id="delete_row" />,
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
      <FormattedMessage
        id="js_helptext"
        values={{
          columnSyntax: <Code>{'row["Column Title"]'}</Code>,
          title: <Code>row.title</Code>,
        }}
      />
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
              <FormattedMessage id="invalid_expression" />}
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

class DeriveColumn extends Component {
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
    const { onClose, onApply, intl } = this.props;
    const { transformation } = this.state;
    const args = transformation.get('args');
    const code = args.get('code');
    return (
      <div
        className="DataTableSidebar DeriveColumn"
      >
        <SidebarHeader onClose={onClose}>
          <FormattedMessage id="derive_column" />
        </SidebarHeader>
        <div className="inputs">
          <div className="inputGroup">
            <label
              htmlFor="titleTextInput"
            >
              <FormattedMessage id="new_column_title" />
            </label>
            <input
              value={args.get('newColumnTitle')}
              type="text"
              className="titleTextInput"
              onChange={evt =>
                this.setTransformationProperty(['args', 'newColumnTitle'], evt.target.value)
              }
              data-test-id="column-title"
            />
          </div>
          <div className="inputGroup">
            <label
              htmlFor="typeSelectInput"
            >
              <FormattedMessage id="new_column_type" />
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
              <FormattedMessage id="if_transformation_fails" />
            </label>
            <SelectMenu
              name="errorStrategy"
              value={transformation.get('onError')}
              onChange={value => this.setTransformationProperty(['onError'], value)}
              options={errorStrategies}
            />
          </div>
          <div className="inputGroup" data-test-id="code">
            <label htmlFor="code">
              <FormattedMessage id="javascript_code" />
            </label>
            <CodeMirror
              placeholder={intl.formatMessage({ id: 'type_javascript_expression_here' })}
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
          positiveButtonText={<FormattedMessage id="derive" />}
          onApply={this.isValidTransformation() ? () => onApply(this.state.transformation) : null}
          onClose={onClose}
        />
      </div>
    );
  }
}

DeriveColumn.propTypes = {
  intl: intlShape.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
};

export default injectIntl(DeriveColumn);
