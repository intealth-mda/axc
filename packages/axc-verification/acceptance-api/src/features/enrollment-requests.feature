Feature: Enrollment requests

  Scenario: B-AC1 course search from Task Set A still works
    When the client searches courses with "q=SECURITY&status=active&pageSize=5&sort=createdAt"
    Then the response status is 200
    And the course ids are "course-003,course-001,course-007"

  Scenario: B-AC2 a valid enrollment request is created as pending
    When a learner requests enrollment in course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 a request for a missing course returns 404
    When the client submits an enrollment request:
      """
      {"courseId": "course-999", "learnerEmail": "learner@example.org", "justification": "I need this course for upcoming work."}
      """
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a request for a <status> course returns 409
    When the client submits an enrollment request:
      """
      {"courseId": "<courseId>", "learnerEmail": "learner@example.org", "justification": "I need this course for upcoming work."}
      """
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | status  | courseId   |
      | draft   | course-004 |
      | retired | course-005 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the client submits an enrollment request:
      """
      {"courseId": "course-001", "learnerEmail": "<email>", "justification": "<justification>"}
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "<field>"

    Examples:
      | field         | email               | justification                          |
      | learnerEmail  | not-an-email        | I need this course for upcoming work.  |
      | justification | learner@example.org | too short                              |

  Scenario Outline: B-AC6 a duplicate <status> request returns 409
    Given a learner has a "<status>" request for course "course-002"
    When the same learner requests enrollment in course "course-002" again
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   |
      | pending  |
      | approved |

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given a learner has a "pending" request for course "course-001"
    When the client looks up that request
    Then the response status is 200
    And the request status is "pending"
    And the status history is "pending"

  Scenario: B-AC8 requests are filtered by status, course and learner
    Given a learner has a "approved" request for course "course-006"
    When the client lists requests for that learner with status "approved" on course "course-006"
    Then the response status is 200
    And the listed requests are only that request
    When the client lists requests for that learner with status "pending" on course "course-006"
    Then no requests are listed

  Scenario Outline: B-AC9 <from> to <to> is a valid transition
    Given a learner has a "<from>" request for course "course-007"
    When the reviewer changes that request status with:
      """
      {"status": "<to>", "changedBy": "reviewer@example.org", "reason": "Reviewed by the training team."}
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
    Given a learner has a "rejected" request for course "course-001"
    When the reviewer changes that request status with:
      """
      {"status": "approved", "changedBy": "reviewer@example.org"}
      """
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection without a reason returns 400
    Given a learner has a "pending" request for course "course-001"
    When the reviewer changes that request status with:
      """
      {"status": "rejected", "changedBy": "reviewer@example.org", "reason": ""}
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "reason"

  Scenario: B-AC12 creation and every status change add a history entry
    Given a learner has a "approved" request for course "course-002"
    When the reviewer changes that request status with:
      """
      {"status": "cancelled", "changedBy": "reviewer@example.org"}
      """
    Then the status history is "pending,approved,cancelled"
    And the last change was by "reviewer@example.org"

  Scenario: B-AC13 existing behaviour still works
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario Outline: B-AC14 error cases use the shared error format: <code>
    When the client <action>
    Then the response status is <status>
    And the error code is "<code>"

    Examples:
      | action                              | status | code                         |
      | looks up request "no-such-request"  | 404    | ENROLLMENT_REQUEST_NOT_FOUND |
      | lists requests with status "done"   | 400    | INVALID_REQUEST              |
      | sends a malformed enrollment request | 400    | INVALID_REQUEST              |

  Scenario: B-AC15 the docs describe every endpoint and error code
    Then the enrollment docs mention "POST /api/enrollment-requests,GET /api/enrollment-requests/:id,GET /api/enrollment-requests,PATCH /api/enrollment-requests/:id/status,COURSE_NOT_FOUND,COURSE_NOT_ACTIVE,INVALID_REQUEST,DUPLICATE_ACTIVE_REQUEST,ENROLLMENT_REQUEST_NOT_FOUND,INVALID_STATUS_TRANSITION"
