Feature: Course catalog search

  Scenario: GET /api/courses returns the default page
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog item count is 10
    And the course catalog total items is 12
    And the course catalog total pages is 2

  Scenario: GET /api/courses combines keyword, modality, and status
    When the client requests the course catalog with query "q=security&modality=online&status=active"
    Then the course catalog responds with status 200
    And the course catalog item ids are "course-001,course-010"

  Scenario: GET /api/courses rejects an invalid page size
    When the client requests the course catalog with query "pageSize=51"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error field "pageSize" says "pageSize must be between 1 and 50."
