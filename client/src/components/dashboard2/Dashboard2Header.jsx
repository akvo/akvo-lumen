import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';

import EntityTypeHeader from '../entity-editor/EntityTypeHeader';
import LoadingSpinner from '../common/LoadingSpinner';

require('./Dashboard2Header.scss');

class Dashboard2Header extends Component {
  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons() {
    const { onDashboardAction, isDashboardDraft } = this.props;

    const share = {
      buttonText: <FormattedMessage id="share" />,
      onClick: () => onDashboardAction('share'),
      disabled: isDashboardDraft,
      tooltipId: isDashboardDraft ? 'save_your_dashboard_before_sharing' : null,
    };

    const isExporting = false;
    const exportButton = {
      buttonText: <FormattedMessage id="export" />,
      disabled: isDashboardDraft,
      tooltipId: isDashboardDraft ? 'save_your_dashboard_before_exporting' : null,
      onOptionSelected: format => onDashboardAction(`export_${format}`),
      icon: isExporting ? <LoadingSpinner /> : null,

      subActions: [
        {
          label: <FormattedMessage id="png" />,
          value: 'png',
        },
        {
          label: <FormattedMessage id="pdf" />,
          value: 'pdf',
        },
      ],
    };

    const result = [
      share,
      exportButton,
    ];
    return result;
  }

  render() {
    const { title } = this.props;
    const actionButtons = this.getActionButtons();

    return (
      <EntityTypeHeader
        title={title}
        onChangeTitle={this.props.onChangeTitle}
        actionButtons={actionButtons}
      />
    );
  }
}

Dashboard2Header.propTypes = {
  intl: intlShape,
  title: PropTypes.string.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onDashboardAction: PropTypes.func.isRequired,
  isDashboardDraft: PropTypes.bool.isRequired,
};

export default injectIntl(Dashboard2Header);
