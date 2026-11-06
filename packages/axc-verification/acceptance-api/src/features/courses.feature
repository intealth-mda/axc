Feature: Course catalog search

  Scenario: GET /api/courses returns the first page with default pagination
    When the client requests the course catalog
    Then the courses endpoint responds with status 200
    And the course page is page 1 with page size 10
    And the course page has 10 items out of 14 total in 2 pages

  Scenario: GET /api/courses filters by keyword, modality and status
    When the client searches the course catalog with "q=security&modality=online&status=active"
    Then the courses endpoint responds with status 200
    And the returned course ids are "course-001, course-005"
    And every returned course has modality "online" and status "active"

  Scenario: GET /api/courses rejects a pageSize above 50
    When the client searches the course catalog with "pageSize=51"
    Then the courses endpoint responds with status 400
    And the error is "INVALID_QUERY_PARAMETER" with detail "pageSize": "pageSize must be between 1 and 50."
