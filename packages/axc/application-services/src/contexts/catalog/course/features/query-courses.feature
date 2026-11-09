Feature: Query courses
 Scenario: Valid queries reach the read repository
  Given a course read repository
  When a valid search is submitted
  Then the matching page is returned
 Scenario: Invalid queries never reach the read repository
  Given a course read repository
  When an invalid search is submitted
  Then validation fails before reading
