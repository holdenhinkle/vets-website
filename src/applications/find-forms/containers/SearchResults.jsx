// Dependencies.
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AlertBox from '@department-of-veterans-affairs/formation-react/AlertBox';
import LoadingIndicator from '@department-of-veterans-affairs/formation-react/LoadingIndicator';
import Pagination from '@department-of-veterans-affairs/formation-react/Pagination';
import { connect } from 'react-redux';
import cloneDeep from 'lodash/cloneDeep';

import { focusElement } from 'platform/utilities/ui';

// Relative imports.
import * as customPropTypes from '../prop-types';
import { updatePaginationAction } from '../actions';
import { getFindFormsAppState, mvpEnhancements } from '../helpers/selectors';
import SearchResult, { deriveLatestIssue } from '../components/SearchResult';
import SelectWidget from '../widgets/SelectWidget';

export const MAX_PAGE_LIST_LENGTH = 10;

export class SearchResults extends Component {
  static propTypes = {
    // From mapStateToProps.
    error: PropTypes.string.isRequired,
    fetching: PropTypes.bool.isRequired,
    page: PropTypes.number.isRequired,
    query: PropTypes.string.isRequired,
    results: PropTypes.arrayOf(customPropTypes.Form.isRequired),
    hasOnlyRetiredForms: PropTypes.bool.isRequired,
    startIndex: PropTypes.number.isRequired,
    showFindFormsResultsLinkToFormDetailPages: PropTypes.bool,
    // From mapDispatchToProps.
    updatePagination: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = { howToSort: '', sortedResults: [] };
    this.sortOptions = ['Last Updated (Newest)', 'Last Updated (Oldest)'];
  }

  componentDidMount() {
    const { props, updateSortedResultsState } = this;
    if (props.results && props.results.length > 0) updateSortedResultsState();
  }

  componentDidUpdate(previousProps, previousState) {
    const { props, state, updateSortedResultsState } = this;
    const { howToSort } = state;
    const justRefreshed = previousProps.fetching && !props.fetching;

    if (justRefreshed || howToSort !== previousState.howToSort) {
      focusElement('[data-forms-focus]');
      updateSortedResultsState();
    }
  }

  onPageSelect = page => {
    const { results, updatePagination } = this.props;

    // Derive the new start index.
    let startIndex = page * MAX_PAGE_LIST_LENGTH - MAX_PAGE_LIST_LENGTH;

    // Ensure the start index is not greater than the total amount of results.
    if (startIndex >= results.length) {
      startIndex = results.length - 1;
    }

    // Update the page and the new start index.
    updatePagination(page, startIndex);

    focusElement('[data-forms-focus]');
  };

  updateSortedResultsState = () => {
    const { props, sortTheResults } = this;
    const clonedResults = cloneDeep(props.results || []);

    const sortedResults = clonedResults.sort((a, b) => sortTheResults(a, b));
    return this.setState({ sortedResults });
  };

  grabCurrentSortState = state => state && this.setState({ howToSort: state });

  sortTheResults = (indexA, indexB) => {
    const [
      LAST_UPDATED_NEWEST_OPTION,
      LAST_UPDATED_OLDEST_OPTION,
    ] = this.sortOptions;

    const latestTimeStampIndexA = deriveLatestIssue(
      indexA.attributes.firstIssuedOn,
      indexA.attributes.lastRevisionOn,
    );

    const latestTimeStampIndexB = deriveLatestIssue(
      indexB.attributes.firstIssuedOn,
      indexB.attributes.lastRevisionOn,
    );

    const newestDate = deriveLatestIssue(
      latestTimeStampIndexA,
      latestTimeStampIndexB,
    );

    const oldestDate =
      latestTimeStampIndexA === newestDate
        ? latestTimeStampIndexB
        : latestTimeStampIndexA;

    if (this.state.howToSort === LAST_UPDATED_NEWEST_OPTION) {
      if (newestDate === latestTimeStampIndexA) return -1;
      else if (newestDate === latestTimeStampIndexB) return 1;
    }

    if (this.state.howToSort === LAST_UPDATED_OLDEST_OPTION) {
      if (oldestDate === latestTimeStampIndexA) return -1;
      else if (oldestDate === latestTimeStampIndexB) return 1;
    }

    return 0;
  };

  render() {
    const { onPageSelect, grabCurrentSortState, sortOptions, state } = this;
    const { sortedResults } = state;
    const {
      error,
      fetching,
      page,
      query,
      results,
      hasOnlyRetiredForms,
      showFindFormsResultsLinkToFormDetailPages,
      startIndex,
    } = this.props;

    // Show loading indicator if we are fetching.
    if (fetching) {
      return <LoadingIndicator setFocus message="Loading search results..." />;
    }

    // Show the error alert box if there was an error.
    if (error) {
      return (
        <AlertBox
          headline="Something went wrong"
          content={error}
          status="error"
        />
      );
    }

    // Do not render if we have not fetched, yet.
    if (!results) {
      return null;
    }

    // Show UX friendly message if all forms are tombstone/ deleted in the results returned.
    if (hasOnlyRetiredForms)
      return (
        <h2
          className="vads-u-font-size--base vads-u-line-height--3 vads-u-font-family--sans
    vads-u-margin-top--1p5 vads-u-font-weight--normal"
          data-forms-focus
        >
          The form you're looking for has been retired or is no longer valid,
          and has been removed from the VA forms database.
        </h2>
      );

    // Show no results found message.
    if (!sortedResults.length) {
      return (
        <h2
          className="vads-u-font-size--base vads-u-line-height--3 vads-u-font-family--sans
        vads-u-margin-top--1p5 vads-u-font-weight--normal"
          data-forms-focus
        >
          No results were found for "<strong>{query}</strong>
          ." Try using fewer words or broadening your search. If you&apos;re
          looking for non-VA forms, go to the{' '}
          <a
            href="https://www.gsa.gov/reference/forms"
            rel="noopener noreferrer"
            target="_blank"
          >
            GSA Forms Library
          </a>
          .
        </h2>
      );
    }

    // Derive the last index.
    const lastIndex = startIndex + MAX_PAGE_LIST_LENGTH;

    // Derive the display labels.
    const startLabel = startIndex + 1;
    const lastLabel =
      lastIndex + 1 > sortedResults.length ? sortedResults.length : lastIndex;

    // Derive the total number of pages.
    const totalPages = Math.ceil(sortedResults.length / MAX_PAGE_LIST_LENGTH);

    const formMetaInfo = {
      query,
      currentPage: page,
      totalResultsCount: sortedResults.length,
      totalResultsPages: totalPages,
    };

    const searchResults = sortedResults
      .slice(startIndex, lastIndex)
      .map((form, index) => (
        <SearchResult
          key={form.id}
          form={form}
          formMetaInfo={{ ...formMetaInfo, currentPositionOnPage: index + 1 }}
          showFindFormsResultsLinkToFormDetailPages={
            showFindFormsResultsLinkToFormDetailPages
          }
        />
      ));

    return (
      <>
        <div className="vads-u-display--flex vads-u-flex-direction--column medium-screen:vads-u-flex-direction--row medium-screen:vads-u-justify-content--space-between">
          <h2
            className="vads-u-font-size--base vads-u-line-height--3 vads-u-font-family--sans vads-u-font-weight--normal vads-u-margin-y--1p5"
            data-forms-focus
          >
            Showing <strong>{startLabel}</strong> &ndash;{' '}
            <strong>{lastLabel}</strong> of{' '}
            <strong>{sortedResults.length}</strong> results for "
            <strong>{query}</strong>"
          </h2>

          {showFindFormsResultsLinkToFormDetailPages && (
            <SelectWidget
              options={sortOptions}
              initialState={'Last Updated (Newest)'}
              grabCurrentState={grabCurrentSortState}
            />
          )}
        </div>

        <dl className="vads-l-grid-container--full">{searchResults}</dl>

        {/* Pagination Row */}
        {sortedResults.length > MAX_PAGE_LIST_LENGTH && (
          <Pagination
            className="find-va-froms-pagination-override"
            maxPageListLength={MAX_PAGE_LIST_LENGTH}
            onPageSelect={onPageSelect}
            page={page}
            pages={totalPages}
            showLastPage
          />
        )}
      </>
    );
  }
}

const mapStateToProps = state => ({
  error: getFindFormsAppState(state).error,
  fetching: getFindFormsAppState(state).fetching,
  page: getFindFormsAppState(state).page,
  query: getFindFormsAppState(state).query,
  results: getFindFormsAppState(state).results,
  hasOnlyRetiredForms: getFindFormsAppState(state).hasOnlyRetiredForms,
  startIndex: getFindFormsAppState(state).startIndex,
  showFindFormsResultsLinkToFormDetailPages: mvpEnhancements(state),
});

const mapDispatchToProps = dispatch => ({
  updatePagination: (page, startIndex) =>
    dispatch(updatePaginationAction(page, startIndex)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SearchResults);
