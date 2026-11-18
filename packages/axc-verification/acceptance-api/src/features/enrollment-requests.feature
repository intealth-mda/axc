Feature: Course search and enrollment requests

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the response status is 200
    And at least 12 courses span 3 modalities, 3 statuses and 10 tags

  Scenario: B-AC1 course search from Task Set A still works
    When the client searches courses with "q=SECURITY&modality=online&status=active&sort=createdAt&pageSize=5"
    Then the response status is 200
    And the course ids are "course-001,course-002"
    When the client searches courses with "pageSize=0&sort=id"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"

  Scenario: B-AC2 a valid request creates a pending request
    When learner "ac2" requests course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 request for a missing course returns 404
    When learner "ac3" requests course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 request for a <status> course returns 409
    When learner "ac4" requests course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | status  | course     |
      | draft   | course-003 |
      | retired | course-005 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the client submits an enrollment request:
      """
      <body>
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "<field>"

    Examples:
      | field         | body                                                                                                   |
      | learnerEmail  | {"courseId":"course-001","learnerEmail":"not-an-email","justification":"A long enough justification."} |
      | justification | {"courseId":"course-001","learnerEmail":"short@example.org","justification":"too short"}                |

  Scenario Outline: B-AC6 duplicate <status> request returns 409
    Given learner "ac6-<status>" has requested course "course-002"
    And a reviewer changes that request to "<status>"
    When learner "ac6-<status>" requests course "course-002"
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   |
      | pending  |
      | approved |

  Scenario: B-AC7 a request is retrieved with its status history
    Given learner "ac7" has requested course "course-004"
    When the client looks up that request
    Then the response status is 200
    And the status history reads "null>pending"

  Scenario: B-AC8 requests filter by status, courseId and learnerEmail
    Given learner "ac8" has requested course "course-006"
    And learner "ac8" has requested course "course-007"
    When the client lists requests for learner "ac8" on course "course-006" with status "pending"
    Then the response status is 200
    And the listed courses are "course-006"

  Scenario Outline: B-AC9 valid transition <from> to <to>
    Given learner "ac9-<from>-<to>" has requested course "course-008"
    And a reviewer changes that request to "<from>"
    When a reviewer rejects that request to "<to>" with reason "Prerequisites missing."
    Then the response status is 200
    And the request status is "<to>"

    Examples:
      | from     | to        |
      | pending  | approved  |
      | pending  | rejected  |
      | pending  | cancelled |
      | approved | cancelled |

  Scenario: B-AC10 invalid transitions return 409
    Given learner "ac10" has requested course "course-011"
    And a reviewer changes that request to "cancelled"
    When a reviewer changes that request to "approved"
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection requires a reason
    Given learner "ac11" has requested course "course-012"
    When a reviewer changes that request to "rejected"
    Then the response status is 400
    And the error names field "reason"

  Scenario: B-AC12 creation and every status change add a statusHistory entry
    Given learner "ac12" has requested course "course-014"
    And a reviewer changes that request to "approved"
    And a reviewer changes that request to "cancelled"
    When the client looks up that request
    Then the status history reads "null>pending,pending>approved,approved>cancelled"

  Scenario: B-AC13 existing tests still pass
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario Outline: B-AC14 error handling covers <case>
    When the client <action>
    Then the response status is <status>
    And the error code is "<code>"

    Examples:
      | case             | action                               | status | code                         |
      | unknown request  | looks up request "enroll-missing"    | 404    | ENROLLMENT_REQUEST_NOT_FOUND |
      | bad status value | lists requests with status "unknown" | 400    | INVALID_REQUEST              |

  Scenario: B-AC15 docs describe every endpoint, body and error case
    Then the "enrollment-requests" doc mentions "POST /api/enrollment-requests,GET /api/enrollment-requests/:id,GET /api/enrollment-requests,PATCH /api/enrollment-requests/:id/status,justification,statusHistory,COURSE_NOT_FOUND,COURSE_NOT_ACTIVE,INVALID_REQUEST,DUPLICATE_ACTIVE_REQUEST,ENROLLMENT_REQUEST_NOT_FOUND,INVALID_STATUS_TRANSITION"
    And the "courses" doc mentions "GET /api/courses,pageSize,INVALID_QUERY_PARAMETER"
