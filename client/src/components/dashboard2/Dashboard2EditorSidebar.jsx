import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';

import AddFilterMenu from './configMenu/AddFilterMenu';
import AddVisualisationMenu from './configMenu/AddVisualisationMenu';

require('../dashboard/DashboardEditor.scss');
require('./Dashboard2EditorSidebar.scss');

const menuTabs = ['visualisations', 'filters'];

class Dashboard2EditorSidebar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tabSelection: 0,
    };
  }

  onAddVisualisation = () => {
    console.log('@onAddVisualisation');
  }

  onAddFilter = () => {
    console.log('@onAddFilter');
  }

  addText() {
    console.log('@addTextEntity');
  }

  switchToFilterTab = () => {
    this.setState({ tabSelection: 1 });
  }

  switchToVisualisationTab = () => {
    this.setState({ tabSelection: 0 });
  }

  render() {
    const { tabSelection } = this.state;
    const visualisationsSelection = tabSelection === 0 ? 'tabItem selected' : 'tabItem';
    const filterSelection = tabSelection === 1 ? 'tabItem selected' : 'tabItem';

    return (
      <div className="DashboardEditorSidebar Dashboard2EditorSidebar">
        <div className="DashboardVisualisationList">
          <div className="Dashboard2SidebarTabMenu">
            <div className={visualisationsSelection}>
              <button onClick={this.switchToVisualisationTab}>
                Visualisations
              </button>
            </div>
            <div className={filterSelection}>
              <button onClick={this.switchToFilterTab}>
                Filters
              </button>
            </div>
            <div className="tabItem action">
              <button onClick={this.addText}>
                +Text
              </button>
            </div>
          </div>
          {tabSelection === 0 ?
            <AddVisualisationMenu onAddVisualisation={this.onAddVisualisation} />
          : null}
          {tabSelection === 1 ?
            <AddFilterMenu onAddFilter={this.onAddFilter} />
          : null}
        </div>
      </div>
    );
  }
}

Dashboard2EditorSidebar.propTypes = {
  intl: intlShape,
  dashboard: PropTypes.object.isRequired,
};

export default Dashboard2EditorSidebar;
