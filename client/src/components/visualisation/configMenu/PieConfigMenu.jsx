import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import { sortableContainer, sortableElement, sortableHandle } from 'react-sortable-hoc';
import arrayMove from 'array-move';

import ToggleInput from '../../common/ToggleInput';
import { filterColumns } from '../../../utilities/column';
import { checkUndefined } from '../../../utilities/utils';

import ConfigMenuSection from '../../common/ConfigMenu/ConfigMenuSection';
import ConfigMenuSectionOptionText from '../../common/ConfigMenu/ConfigMenuSectionOptionText';
import ConfigMenuSectionOptionSelect from '../../common/ConfigMenu/ConfigMenuSectionOptionSelect';


function PieConfigMenu(props) {
  const {
    visualisation,
    onChangeSpec,
    columnOptions,
  } = props;
  const spec = visualisation.spec;

  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6']);

  const DragHandle = sortableHandle(() => <span>::</span>);

  const SortableItem = sortableElement(({ value }) => <li><DragHandle />{value}</li>);

  const SortableList = sortableContainer(() =>
    (
      <ul>
        {items.map((value, index) => (
          <SortableItem key={`item-${value}`} index={index} value={value} />
        ))}
      </ul>
    )
  );

  const onSortEnd = ({ oldIndex, newIndex }) => {
    setItems(arrayMove(items, oldIndex, newIndex));
  };


  return (
    <div className="PieConfigMenu">
      <ConfigMenuSection
        title="bucket_column"
        options={(
          <ConfigMenuSectionOptionSelect
            placeholderId="select_a_data_column_to_group_by"
            value={spec.bucketColumn !== null ? spec.bucketColumn.toString() : null}
            name="xGroupColumnMenu"
            options={filterColumns(columnOptions, ['number', 'date', 'text'])}
            clearable
            onChange={value => onChangeSpec({
              bucketColumn: value,
              legendTitle: columnOptions.find(item => item.value === value) ?
                columnOptions.find(item => item.value === value).title : null,
            })}
          />
        )}
        advancedOptions={(
          <div>
            <ToggleInput
              name="showLegend"
              type="checkbox"
              labelId="show_legend"
              className="InputGroup"
              checked={Boolean(spec.showLegend)}
              onChange={val => onChangeSpec({
                showLegend: val,
              })}
            />
            {Boolean(spec.showLegend) && (
              <div>
                {Boolean(props.env.environment.orderedLegend) && (
                  <div>
                    <ToggleInput
                      name="orderLegend"
                      type="checkbox"
                      labelId="legend_category_order"
                      className="InputGroup"
                      checked={Boolean(checkUndefined(spec, 'legend', 'order', 'mode') === 'custom')}
                      onChange={val => onChangeSpec({
                        legend: { order: { mode: val ? 'custom' : 'auto' } },
                      })}
                    />
                    <SortableList items={items} onSortEnd={onSortEnd} />
                  </div>)}
                <ConfigMenuSectionOptionText
                  value={spec.legendTitle != null ? spec.legendTitle.toString() : null}
                  placeholderId="legend_title"
                  name="legendLabel"
                  maxLength={32}
                  onChange={event => onChangeSpec({
                    legendTitle: event.target.value.toString(),
                  }, spec, onChangeSpec, columnOptions)}
                />
                <ConfigMenuSectionOptionSelect
                  placeholderId="legend_position"
                  value={spec.legendPosition}
                  name="legendPosition"
                  options={[
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_auto' }),
                      value: null,
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_top' }),
                      value: 'top',
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_right' }),
                      value: 'right',
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_bottom' }),
                      value: 'bottom',
                    },
                    {
                      label: props.intl.formatMessage({ id: 'legend_position_left' }),
                      value: 'left',
                    },
                  ]}
                  clearable
                  onChange={value => onChangeSpec({ legendPosition: value })}
                />
              </div>
            )}
            <ToggleInput
              name="showLabels"
              type="checkbox"
              labelId="show_labels"
              className="InputGroup"
              checked={Boolean(spec.showLabels)}
              onChange={val => onChangeSpec({
                showLabels: val,
              })}
            />
          </div>
        )}
      />
    </div>
  );
}

PieConfigMenu.propTypes = {
  intl: intlShape.isRequired,
  visualisation: PropTypes.object.isRequired,
  env: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  columnOptions: PropTypes.array.isRequired,
  aggregationOptions: PropTypes.array.isRequired,
};

export default injectIntl(PieConfigMenu);
