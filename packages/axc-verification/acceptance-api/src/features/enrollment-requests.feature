Feature: Enrollment requests

  Scenario: B-AC2 B-AC12 a valid request is created pending with a creation history entry
    When a new learner submits a request for course "course-001"
    Then the response status is 201
    And the request status is "pending"
    And the status history is "null>pending"

  Scenario: B-AC3 a request for a missing course returns 404
    When a new learner submits a request for course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a request for a draft or retired course returns 409
    When a new learner submits a request for course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | course     |
      | course-004 |
      | course-006 |

  Scenario Outline: B-AC5 invalid email or short justification returns 400
    When the client submits a request with:
      """
      <body>
      """
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error names field "<field>"

    Examples:
      | body                                                                                              | field         |
      | {"courseId":"course-001","learnerEmail":"not-an-email","justification":"Long enough justification text."} | learnerEmail  |
      | {"courseId":"course-001","learnerEmail":"short@example.org","justification":"too short"}          | justification |

  Scenario Outline: B-AC6 duplicate pending or approved requests return 409
    Given a learner has a request for course "course-002" moved to "<status>"
    When the same learner submits another request for course "course-002"
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   |
      | pending  |
      | approved |

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given a learner has a request for course "course-003" moved to "pending"
    When the client looks up that request
    Then the response status is 200
    And the request status is "pending"
    And the status history is "null>pending"

  Scenario: B-AC7 an unknown request returns 404
    When the client looks up request "missing-id"
    Then the response status is 404
    And the error code is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: B-AC8 requests filter by status, courseId and learnerEmail
    Given a learner has a request for course "course-005" moved to "approved"
    When the client lists requests for that learner on course "course-005" with status "approved"
    Then the response status is 200
    And the list holds only that request

  Scenario Outline: B-AC9 B-AC12 valid transitions succeed and append history
    Given a learner has a request for course "course-007" moved to "<from>"
    When the reviewer changes that request with:
      """
      {"status":"<to>","changedBy":"reviewer@example.org","reason":"Reviewed by the training team."}
      """
    Then the response status is 200
    And the request status is "<to>"
    And the status history is "<history>"

    Examples:
      | from     | to        | history                      |
      | pending  | approved  | null>pending>approved        |
      | pending  | rejected  | null>pending>rejected        |
      | pending  | cancelled | null>pending>cancelled       |
      | approved | cancelled | null>pending>approved>cancelled |

  Scenario: B-AC10 an invalid transition returns 409
    Given a learner has a request for course "course-008" moved to "cancelled"
    When the reviewer changes that request with:
      """
      {"status":"approved","changedBy":"reviewer@example.org"}
      """
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection without a reason returns 400
    Given a learner has a request for course "course-010" moved to "pending"
    When the reviewer changes that request with:
      """
      {"status":"rejected","changedBy":"reviewer@example.org"}
      """
    Then the response status is 400
    And the error names field "reason"

  Scenario: an unknown status value returns 400
    Given a learner has a request for course "course-012" moved to "pending"
    When the reviewer changes that request with:
      """
      {"status":"done","changedBy":"reviewer@example.org"}
      """
    Then the response status is 400
    And the error names field "status"
