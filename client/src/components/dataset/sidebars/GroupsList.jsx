import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage, intlShape } from 'react-intl';
import { MdRepeat } from 'react-icons/md';
import SidebarHeader from './SidebarHeader';

require('./GroupsList.scss');

function GroupsList(props) {
  const { onClose, groups, selectedGroup, onSelectGroup } = props;

  return (
    <div className="DataTableSidebar GroupsList" id="GroupsList">
      <SidebarHeader
        onClose={onClose}
        closeButton={<i onClick={onClose} className="fa fa-angle-left clickable" />}
      >
        <FormattedMessage id="data_groups" />
      </SidebarHeader>

      <div className="inputs">
        {groups.map((group, id) => {
          const className = `groupItem clickable ${selectedGroup === group.id ? 'active' : ''}`;

          return (
            <div
              onClick={() => onSelectGroup(group)}
              key={id}
              className={className}
            >
              <p>
                {['metadata', 'transformations', 'main'].includes(group.name) ? (
                  <FormattedMessage id={group.name} />
                ) : (
                  group.name
                )}
              </p>
              {group.isRqg && <MdRepeat className="icon" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

GroupsList.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSelectGroup: PropTypes.func.isRequired,
  groups: PropTypes.array,
  selectedGroup: PropTypes.string,
  intl: intlShape,
};

export default injectIntl(GroupsList);
