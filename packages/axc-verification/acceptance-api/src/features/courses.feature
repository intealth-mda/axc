Feature: Course catalog search

  Scenario: GET /api/courses returns the default first page
    When the client requests courses with query ""
    Then the courses endpoint responds with status 200
    And the courses page is 1 with page size 10, 14 total items, and 2 total pages
    And the courses response contains 10 items

  Scenario: GET /api/courses combines keyword, modality, and status filters
    When the client requests courses with query "?q=SECURITY&modality=online&status=active"
    Then the courses endpoint responds with status 200
    And the returned course ids are "course-001"

  Scenario: GET /api/courses rejects an invalid pageSize
    When the client requests courses with query "?pageSize=51"
    Then the courses endpoint responds with status 400
    And the courses error envelope reports field "pageSize" with message "pageSize must be between 1 and 50."
