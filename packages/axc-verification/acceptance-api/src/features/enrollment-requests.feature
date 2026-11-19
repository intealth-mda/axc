Feature: Course search and enrollment requests

  Scenario: B-AC1 course search from Task Set A still works
    When the client searches courses with "q=SECURITY&modality=online&status=active&page=1&pageSize=5&sort=title"
    Then the response status is 200
    And every course matches modality "online" and status "active"
    And the course page size is 5

  Scenario: B-AC1 seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the response status is 200
    And the catalog holds at least 12 courses mixing every modality and status

  Scenario: B-AC1 invalid course search parameters return 400
    When the client searches courses with "pageSize=0"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "pageSize"

  Scenario: B-AC2 a valid request creates a pending request
    When learner "ac2@example.org" requests course "course-001"
    Then the response status is 201
    And the request status is "pending"

  Scenario: B-AC3 a missing course returns 404
    When learner "ac3@example.org" requests course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a <state> course returns 409
    When learner "ac4@example.org" requests course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | state   | course     |
      | draft   | course-005 |
      | retired | course-006 |

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
      | learnerEmail  | {"courseId":"course-001","learnerEmail":"not-an-email","justification":"Long enough justification text."} |
      | justification | {"courseId":"course-001","learnerEmail":"ac5@example.org","justification":"too short"}                 |

  Scenario Outline: B-AC6 duplicate <state> request returns 409
    Given learner "<email>" has a <state> request for course "course-002"
    When learner "<email>" requests course "course-002"
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | state    | email            |
      | pending  | ac6p@example.org |
      | approved | ac6a@example.org |

  Scenario: B-AC7 get by id returns the request with status history
    Given learner "ac7@example.org" has a pending request for course "course-003"
    When the client looks up that request
    Then the response status is 200
    And the history reads "null>pending"

  Scenario: B-AC7 an unknown request id returns 404
    When the client looks up request "enroll-missing"
    Then the response status is 404
    And the error code is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: B-AC8 list filters by status, courseId and learnerEmail
    Given learner "ac8@example.org" has a approved request for course "course-004"
    And learner "ac8@example.org" has a pending request for course "course-007"
    When the client lists requests with "status=approved&courseId=course-004&learnerEmail=ac8@example.org"
    Then the response status is 200
    And the listed requests are "course-004:approved"

  Scenario Outline: B-AC9 transition <from> to <to> succeeds
    Given learner "<email>" has a <from> request for course "course-008"
    When the reviewer changes that request with:
      """
      {"status":"<to>","changedBy":"reviewer@example.org","reason":"Reason text"}
      """
    Then the response status is 200
    And the request status is "<to>"

    Examples:
      | from     | to        | email            |
      | pending  | approved  | ac9a@example.org |
      | pending  | rejected  | ac9b@example.org |
      | pending  | cancelled | ac9c@example.org |
      | approved | cancelled | ac9d@example.org |

  Scenario: B-AC10 an invalid transition returns 409
    Given learner "ac10@example.org" has a pending request for course "course-010"
    And the reviewer changes that request with:
      """
      {"status":"cancelled","changedBy":"reviewer@example.org"}
      """
    When the reviewer changes that request with:
      """
      {"status":"approved","changedBy":"reviewer@example.org"}
      """
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC10 an unknown status value returns 400
    Given learner "ac10b@example.org" has a pending request for course "course-010"
    When the reviewer changes that request with:
      """
      {"status":"done","changedBy":"reviewer@example.org"}
      """
    Then the response status is 400
    And the error names field "status"

  Scenario: B-AC11 rejection without a reason returns 400
    Given learner "ac11@example.org" has a pending request for course "course-012"
    When the reviewer changes that request with:
      """
      {"status":"rejected","changedBy":"reviewer@example.org"}
      """
    Then the response status is 400
    And the error names field "reason"

  Scenario: B-AC12 creation and every status change add a history entry
    Given learner "ac12@example.org" has a approved request for course "course-013"
    When the reviewer changes that request with:
      """
      {"status":"cancelled","changedBy":"reviewer@example.org"}
      """
    Then the history reads "null>pending,pending>approved,approved>cancelled"

  Scenario: B-AC13 existing tests still pass and the healthcheck still answers
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: B-AC14 a malformed JSON body is an error handled as 400
    When the client sends a malformed enrollment request
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

  Scenario: B-AC15 docs describe every endpoint and error code
    Then the enrollment requests doc lists every endpoint and error code
