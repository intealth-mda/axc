Feature: Course search and enrollment requests

  Scenario: Create a pending enrollment request
    When the client submits an enrollment request for "course-001"
    Then the response status is 201
    And the enrollment request is pending

  Scenario: Search courses with combined filters
    When the client searches courses with "q=security&modality=online&status=active"
    Then the response status is 200
    And the search returns 2 online active security courses

  Scenario: Reject an invalid enrollment request
    When the client submits an enrollment request with justification "too short"
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error field is "justification"
