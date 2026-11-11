Feature: Enrollment requests

  Background:
    Given a new learner

  Scenario: B-AC1 course search from Task Set A still works
    When the client searches courses with "q=SECURITY&status=active&pageSize=5"
    Then the response status is 200
    And the listed course ids are "course-001,course-006"
    When the client searches courses with "pageSize=0"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"

  Scenario: B-AC2 a valid request creates a pending request
    When the learner requests enrollment in course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 a missing course returns 404
    When the learner requests enrollment in course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a <state> course returns 409
    When the learner requests enrollment in course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | state   | course     |
      | draft   | course-003 |
      | retired | course-004 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the learner submits an enrollment request:
      """
      { "courseId": "course-001", "learnerEmail": "<email>", "justification": "<justification>" }
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "<field>"

    Examples:
      | field         | email               | justification                              |
      | learnerEmail  | not-an-email        | I need this course for my upcoming work.   |
      | justification | learner@example.org | too short                                  |

  Scenario Outline: B-AC6 a duplicate <status> request returns 409
    Given the learner has a <status> request for course "course-002"
    When the learner requests enrollment in course "course-002"
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   |
      | pending  |
      | approved |

  Scenario: B-AC7 a request is retrieved with its status history
    Given the learner has a pending request for course "course-001"
    When the client looks up that request
    Then the response status is 200
    And the status history is "null>pending"
    When the client looks up request "missing-id"
    Then the response status is 404
    And the error code is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: B-AC8 requests are filtered by status, course and learner
    Given the learner has a approved request for course "course-001"
    And the learner has a pending request for course "course-005"
    When the client lists the learner's requests with status "pending" in course "course-005"
    Then the response status is 200
    And the listed request courses are "course-005"
    When the client lists the learner's requests with status "rejected" in course "course-005"
    Then the listed request courses are ""
    When the client lists the learner's requests with status "bogus" in course "course-005"
    Then the response status is 400

  Scenario Outline: B-AC9 <from> to <to> is a valid transition
    Given the learner has a <from> request for course "course-006"
    When a reviewer changes that request status with:
      """
      { "status": "<to>", "changedBy": "reviewer@example.org", "reason": "Reviewed by the team." }
      """
    Then the response status is 200
    And the request status is "<to>"

    Examples:
      | from     | to        |
      | pending  | approved  |
      | pending  | rejected  |
      | pending  | cancelled |
      | approved | cancelled |

  Scenario: B-AC10 an invalid transition returns 409
    Given the learner has a approved request for course "course-002"
    When a reviewer changes that request status with:
      """
      { "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Too late." }
      """
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection requires a reason
    Given the learner has a pending request for course "course-002"
    When a reviewer changes that request status with:
      """
      { "status": "rejected", "changedBy": "reviewer@example.org", "reason": " " }
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "reason"

  Scenario: B-AC12 creation and every status change add a history entry
    Given the learner has a approved request for course "course-005"
    When a reviewer changes that request status with:
      """
      { "status": "cancelled", "changedBy": "reviewer@example.org" }
      """
    Then the status history is "null>pending,pending>approved,approved>cancelled"

  Scenario: B-AC13 existing behaviour still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: B-AC14 malformed input is rejected as an error
    When the learner submits malformed JSON
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

  Scenario: B-AC15 the docs describe every endpoint and error code
    Then the enrollment requests doc mentions "POST /api/enrollment-requests,GET /api/enrollment-requests/:id,GET /api/enrollment-requests,PATCH /api/enrollment-requests/:id/status,COURSE_NOT_FOUND,COURSE_NOT_ACTIVE,INVALID_REQUEST,DUPLICATE_ACTIVE_REQUEST,ENROLLMENT_REQUEST_NOT_FOUND,INVALID_STATUS_TRANSITION,statusHistory"
