Feature: Course search and enrollment requests

  Scenario: GET /api/courses applies keyword, modality, and status together
    When the client searches courses with q "security", modality "online", and status "active"
    Then the response status is 200
    And the course search returns only "course-001"

  Scenario: POST /api/enrollment-requests creates a pending request that can be approved
    When the client creates an enrollment request for "course-001"
    Then the response status is 201
    And the enrollment request is pending for "course-001"
    When the client approves the enrollment request
    Then the response status is 200
    When the client reads the enrollment request
    Then the response status is 200
    And the enrollment request status history has 2 entries

  Scenario: GET /api/courses rejects an invalid page size
    When the client searches courses with pageSize "51"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
