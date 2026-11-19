Feature: Enrollment requests

  Scenario: B-AC2 a valid request is created pending
    When a learner requests course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 a missing course returns 404
    When a learner requests course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a draft or retired course returns 409
    When a learner requests course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | course     |
      | course-005 |
      | course-006 |

  Scenario Outline: B-AC5 invalid email or short justification returns 400
    When the client submits an enrollment request:
      """
      <body>
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "<field>"

    Examples:
      | body                                                                                         | field         |
      | {"courseId":"course-001","learnerEmail":"nope","justification":"A long enough justification."} | learnerEmail  |
      | {"courseId":"course-001","learnerEmail":"a@b.org","justification":"too short"}               | justification |

  Scenario Outline: B-AC6 duplicate pending or approved requests return 409
    Given a learner has a "<status>" request for course "course-002"
    When the same learner requests that course again
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   |
      | pending  |
      | approved |

  Scenario: B-AC7 a request is retrieved with its status history
    Given a learner has a "pending" request for course "course-003"
    When the client looks up that request
    Then the response status is 200
    And the history is "null>pending"

  Scenario: B-AC8 requests filter by status, courseId and learnerEmail
    Given a learner has a "approved" request for course "course-004"
    When the client lists that learner's requests with status "approved" for course "course-004"
    Then the listed ids are just that request

  Scenario Outline: B-AC9 valid transitions succeed
    Given a learner has a "<from>" request for course "course-007"
    When the reviewer changes that request to "<to>" with reason "Missing prerequisite course."
    Then the response status is 200
    And the request status is "<to>"

    Examples:
      | from     | to        |
      | pending  | approved  |
      | pending  | rejected  |
      | pending  | cancelled |
      | approved | cancelled |

  Scenario: B-AC10 invalid transitions return 409
    Given a learner has a "cancelled" request for course "course-008"
    When the reviewer changes that request to "approved" with reason ""
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection requires a reason
    Given a learner has a "pending" request for course "course-010"
    When the reviewer changes that request to "rejected" with reason ""
    Then the response status is 400
    And the error names field "reason"

  Scenario: B-AC12 creation and each status change add history
    Given a learner has a "cancelled" request for course "course-001"
    When the client looks up that request
    Then the history is "null>pending,pending>approved,approved>cancelled"

  Scenario: B-AC13 existing healthcheck still answers
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: B-AC14 error handling for unknown request and bad status
    When the client looks up request "missing-id"
    Then the response status is 404
    And the error code is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: B-AC15 docs describe endpoints, bodies and errors
    Then the docs page "enrollment-requests" mentions "POST /api/enrollment-requests,GET /api/enrollment-requests/:id,PATCH /api/enrollment-requests/:id/status,statusHistory,COURSE_NOT_FOUND,COURSE_NOT_ACTIVE,DUPLICATE_ACTIVE_REQUEST,ENROLLMENT_REQUEST_NOT_FOUND,INVALID_STATUS_TRANSITION,INVALID_REQUEST"
