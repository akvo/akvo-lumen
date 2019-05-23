import React from 'react';
import PropTypes from 'prop-types';
import { Container, Row, Col } from 'react-grid-system';
import { FormattedMessage, injectIntl } from 'react-intl';

import { ListGroup, ListGroupItem } from '../../common/ListGroup';
import STATUS from '../../../constants/status';

import './SourceDeriveCategoryOptions.scss';

const SourceDeriveCategoryOptions = ({ dataset, onChange, selected }) => (
  <Container className="SourceDeriveCategoryOptions">
    <Row>
      <Col md={6} offset={{ md: 3 }}>
        <h2>
          <FormattedMessage id="select_source_column" />
        </h2>
        <ListGroup>
          {dataset.columns &&
            dataset.columns.filter(({ type }) => type === 'text')
              .map(({ columnName, title, type }) => (
                <ListGroupItem
                  key={columnName}
                  lg
                  onClick={() => onChange(columnName)}
                  status={columnName === selected ? STATUS.SUCCESS : undefined}
                  icon={columnName === selected ? 'check' : undefined}
                >
                  <span className="SourceDeriveCategoryOptions__title">{title}</span>
                  <span className="SourceDeriveCategoryOptions__type">
                    <FormattedMessage id={type} />
                  </span>
                </ListGroupItem>
              ))
          }
        </ListGroup>
      </Col>
    </Row>
  </Container>
);

export default injectIntl(SourceDeriveCategoryOptions);

SourceDeriveCategoryOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  selected: PropTypes.string,
};
