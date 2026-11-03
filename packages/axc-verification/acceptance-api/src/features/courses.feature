Feature: Course catalog search

  Scenario: GET /api/courses returns the first page
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog returns page 1 of size 10 from 12 courses

  Scenario: GET /api/courses applies keyword, modality, and status together
    When the client requests the course catalog with "q=security&modality=online&status=active"
    Then the course catalog responds with status 200
    And the course catalog returns only course "course-001"

  Scenario: GET /api/courses rejects an invalid page size
    When the client requests the course catalog with "pageSize=51"
    Then the course catalog responds with status 400
    And the course catalog error names field "pageSize" with message "pageSize must be between 1 and 50."
