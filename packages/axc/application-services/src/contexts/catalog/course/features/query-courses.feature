Feature: Search course catalog
 Scenario: Delegating a valid search to the read repository
  Given a course read repository
  When a valid catalog search is requested
  Then the repository receives the query and its result is returned
 Scenario: Rejecting invalid searches before accessing storage
  Given a course read repository
  When invalid catalog searches are requested
  Then every invalid search is rejected without a repository call
