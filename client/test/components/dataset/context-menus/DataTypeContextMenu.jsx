import React from 'react';
import { shallow } from 'enzyme';
import assert from 'assert';
import DataTypeContextMenu from
  '../../../../src/components/dataset/context-menus/DataTypeContextMenu';
import ContextMenu from '../../../../src/components/common/ContextMenu';


describe('<DataTypeContextMenu />', () => {
  const baseProps = {
    column: {},
    dimensions: { top: 0, left: 0 },
    onContextMenuItemSelected: () => {},
  };

  it('should render without error', () => {
    shallow(<DataTypeContextMenu {...baseProps} />);
  });
  it('renders a ContextMenu', () => {
    const wrapper = shallow(<DataTypeContextMenu {...baseProps} />);
    assert.equal(wrapper.find(ContextMenu).length, 1);
  });
});
