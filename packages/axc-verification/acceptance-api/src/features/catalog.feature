Feature: Course catalog and enrollment requests

  Scenario: POST /api/enrollment-requests creates a pending request
    When the client creates an enrollment request for the active security course
    Then the enrollment response has status 201
    And the enrollment request is pending for course-001

  Scenario: GET /api/courses applies keyword, modality, and status together
    When the client searches for online active security courses
    Then the course search responds with status 200
    And the course search returns only online active security courses

  Scenario: GET /api/courses rejects an invalid page size
    When the client requests courses with page size 0
    Then the course search responds with status 400
    And the course search error code is INVALID_QUERY_PARAMETER
