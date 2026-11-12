Feature: Course search and enrollment requests

  Scenario: B-AC1 course search from Task Set A still works
    When the client searches courses with "q=SECURITY&status=active&sort=createdAt"
    Then the response status is 200
    And every returned course has status "active"
    And the returned courses are sorted by createdAt

  Scenario Outline: B-AC1 invalid course search parameter <query> returns 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query        | field    |
      | modality=x   | modality |
      | status=x     | status   |
      | page=0       | page     |
      | pageSize=51  | pageSize |
      | sort=x       | sort     |

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the total course count is at least 12
    And the courses span at least 3 modality values
    And the courses span at least 3 status values
    And the courses span at least 5 tag values

  Scenario: B-AC2 a valid request creates a pending request
    When the client submits a valid enrollment request for course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 a request for a missing course returns 404
    When the client submits an enrollment request:
      """
      {"courseId": "course-999", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming work."}
      """
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a request for a <state> course returns 409
    When the client submits a valid enrollment request for course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | state   | course     |
      | draft   | course-006 |
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
      | field         | email               | justification                                    |
      | learnerEmail  | not-an-email        | I need this course to prepare for upcoming work. |
      | justification | learner@example.org | too short                                        |

  Scenario: B-AC6 a duplicate pending request returns 409
    Given the client has submitted an enrollment request for course "course-002"
    When the client submits the same enrollment request again
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: B-AC6 a duplicate approved request returns 409
    Given the client has submitted an enrollment request for course "course-002"
    And the client changes that request status to "approved"
    When the client submits the same enrollment request again
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given the client has submitted an enrollment request for course "course-003"
    When the client looks up that enrollment request
    Then the response status is 200
    And the request status is "pending"
    And the status history is "null>pending"

  Scenario: B-AC7 an unknown request id returns 404
    When the client looks up enrollment request "does-not-exist"
    Then the response status is 404
    And the error code is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: B-AC8 requests are filtered by status, courseId and learnerEmail
    Given the client has submitted an enrollment request for course "course-004"
    When the client lists enrollment requests with status "pending" for that course and learner
    Then the response status is 200
    And the listed requests are exactly that request
    When the client lists enrollment requests with status "approved" for that course and learner
    Then no requests are listed

  Scenario Outline: B-AC9 pending to <to> is allowed
    Given the client has submitted an enrollment request for course "course-007"
    When the client changes that request status to "<to>"
    Then the response status is 200
    And the request status is "<to>"

    Examples:
      | to        |
      | approved  |
      | rejected  |
      | cancelled |

  Scenario: B-AC9 approved to cancelled is allowed
    Given the client has submitted an enrollment request for course "course-008"
    And the client changes that request status to "approved"
    When the client changes that request status to "cancelled"
    Then the response status is 200
    And the request status is "cancelled"

  Scenario: B-AC10 an invalid transition returns 409
    Given the client has submitted an enrollment request for course "course-011"
    And the client changes that request status to "rejected"
    When the client changes that request status to "approved"
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection without a reason returns 400
    Given the client has submitted an enrollment request for course "course-012"
    When the client changes that request status with:
      """
      {"status": "rejected", "changedBy": "reviewer@example.org"}
      """
    Then the response status is 400
    And the error names field "reason"

  Scenario: B-AC12 creation and every status change add a history entry
    Given the client has submitted an enrollment request for course "course-001"
    And the client changes that request status to "approved"
    And the client changes that request status to "cancelled"
    When the client looks up that enrollment request
    Then the status history is "null>pending,pending>approved,approved>cancelled"

  Scenario: B-AC13 existing behaviour still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario Outline: B-AC14 error handling: <case> returns 400
    When the client changes request "does-not-exist" status with:
      """
      <body>
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

    Examples:
      | case           | body                                    |
      | invalid status | {"status": "done", "changedBy": "rev"}  |
      | missing field  | {"status": "approved"}                  |

  Scenario Outline: B-AC15 docs describe <item>
    Then the enrollment requests documentation mentions "<item>"

    Examples:
      | item                                    |
      | POST /api/enrollment-requests           |
      | GET /api/enrollment-requests/:id        |
      | GET /api/enrollment-requests            |
      | PATCH /api/enrollment-requests/:id/status |
      | COURSE_NOT_FOUND                        |
      | COURSE_NOT_ACTIVE                       |
      | DUPLICATE_ACTIVE_REQUEST                |
      | ENROLLMENT_REQUEST_NOT_FOUND            |
      | INVALID_STATUS_TRANSITION               |
      | INVALID_REQUEST                         |
      | statusHistory                           |
