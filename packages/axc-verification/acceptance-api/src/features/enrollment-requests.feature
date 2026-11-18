Feature: Course search and enrollment requests

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the response status is 200
    And at least 12 courses are returned
    And the courses cover modalities "hybrid,in-person,online" and statuses "active,draft,retired"

  Scenario: B-AC1 course search from Task Set A still works
    When the client searches courses with "q=SECURITY&status=active&sort=createdAt&pageSize=2"
    Then the response status is 200
    And every returned course has status "active"
    And the page metadata is page 1 of size 2

  Scenario: B-AC1 invalid course search parameter returns 400
    When the client searches courses with "pageSize=99"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "pageSize"

  Scenario: B-AC2 a valid request is created as pending
    When the learner "ac2@example.org" requests course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 request for a missing course returns 404
    When the learner "ac3@example.org" requests course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 request for a <state> course returns 409
    When the learner "ac4@example.org" requests course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | state   | course     |
      | draft   | course-006 |
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
      | field         | body                                                                                                  |
      | learnerEmail  | {"courseId":"course-001","learnerEmail":"not-an-email","justification":"A long enough justification."} |
      | justification | {"courseId":"course-001","learnerEmail":"ac5@example.org","justification":"too short"}                 |

  Scenario Outline: B-AC6 duplicate <status> request returns 409
    Given the learner "<email>" has a <status> request for course "course-002"
    When the learner "<email>" requests course "course-002"
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   | email                    |
      | pending  | ac6-pending@example.org  |
      | approved | ac6-approved@example.org |

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given the learner "ac7@example.org" has a pending request for course "course-003"
    When the client looks up that request
    Then the response status is 200
    And the request status is "pending"
    And the status history is ":pending"

  Scenario: B-AC8 requests are filtered by status, courseId and learnerEmail
    Given the learner "ac8@example.org" has a approved request for course "course-004"
    And the learner "ac8@example.org" has a pending request for course "course-007"
    When the client lists requests with "status=approved&courseId=course-004&learnerEmail=ac8@example.org"
    Then the response status is 200
    And the listed requests are "course-004:approved"

  Scenario Outline: B-AC9 valid transition <path>
    Given the learner "<email>" has a pending request for course "course-008"
    When the reviewer moves that request through "<path>"
    Then the response status is 200
    And the request status is "<final>"

    Examples:
      | email          | path               | final     |
      | ac9a@ex.org    | approved           | approved  |
      | ac9b@ex.org    | rejected           | rejected  |
      | ac9c@ex.org    | cancelled          | cancelled |
      | ac9d@ex.org    | approved,cancelled | cancelled |

  Scenario: B-AC10 invalid transition returns 409
    Given the learner "ac10@example.org" has a pending request for course "course-010"
    When the reviewer moves that request through "cancelled,approved"
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection without a reason returns 400
    Given the learner "ac11@example.org" has a pending request for course "course-010"
    When the reviewer changes that request status with:
      """
      {"status":"rejected","changedBy":"reviewer@example.org"}
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "reason"

  Scenario: B-AC12 creation and each status change add a history entry
    Given the learner "ac12@example.org" has a pending request for course "course-012"
    When the reviewer moves that request through "approved,cancelled"
    And the client looks up that request
    Then the status history is ":pending,pending:approved,approved:cancelled"

  Scenario: B-AC13 existing healthcheck still answers
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario Outline: B-AC14 error handling: <case>
    When <action>
    Then the response status is <status>
    And the error code is "<code>"

    Examples:
      | case              | action                                          | status | code                         |
      | unknown request   | the client looks up request "missing-id"        | 404    | ENROLLMENT_REQUEST_NOT_FOUND |
      | bad status filter | the client lists requests with "status=unknown" | 400    | INVALID_REQUEST              |
      | malformed JSON    | the client submits malformed JSON               | 400    | INVALID_REQUEST              |

  Scenario: B-AC14 invalid status value returns 400
    Given the learner "ac14@example.org" has a pending request for course "course-012"
    When the reviewer moves that request through "archived"
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

  Scenario: B-AC15 docs describe every endpoint and error code
    When the reader opens the enrollment requests documentation
    Then it mentions "POST /api/enrollment-requests,GET /api/enrollment-requests/:id,GET /api/enrollment-requests,PATCH /api/enrollment-requests/:id/status,COURSE_NOT_FOUND,COURSE_NOT_ACTIVE,DUPLICATE_ACTIVE_REQUEST,ENROLLMENT_REQUEST_NOT_FOUND,INVALID_STATUS_TRANSITION,INVALID_REQUEST,statusHistory"
