Feature: Course search and enrollment requests

  Scenario Outline: B-AC1 course search from Task Set A still works
    When the client sends GET "<path>"
    Then the response status is <status>
    And the response field "<field>" is "<value>"

    Examples:
      | path                                                         | status | field         | value      |
      | /api/courses                                                 | 200    | totalItems    | 12         |
      | /api/courses?q=SECURITY&modality=online&status=active&tag=ai | 200    | items.0.id    | course-001 |
      | /api/courses?page=2&pageSize=5&sort=createdAt                | 200    | items.0.id    | course-006 |
      | /api/courses?q=zzz                                           | 200    | items.length  | 0          |
      | /api/courses?sort=bogus                                      | 400    | error.code    | INVALID_REQUEST |
      | /api/courses?pageSize=51                                     | 400    | error.details.0.field | pageSize |

  Scenario: B-AC2 a valid POST creates a pending request
    When "ac2@example.org" requests enrollment in "course-001"
    Then the response status is 201
    And the response field "status" is "pending"
    And the response field "courseId" is "course-001"

  Scenario: B-AC3 a missing course returns 404
    When "ac3@example.org" requests enrollment in "course-999"
    Then the response status is 404
    And the response field "error.code" is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a <state> course returns 409
    When "ac4@example.org" requests enrollment in "<course>"
    Then the response status is 409
    And the response field "error.code" is "COURSE_NOT_ACTIVE"

    Examples:
      | state   | course     |
      | draft   | course-002 |
      | retired | course-003 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the client posts to "/api/enrollment-requests" the body '<body>'
    Then the response status is 400
    And the response field "error.code" is "INVALID_REQUEST"
    And the response field "error.details.0.field" is "<field>"

    Examples:
      | field         | body                                                                                                    |
      | learnerEmail  | {"courseId":"course-001","learnerEmail":"not-an-email","justification":"Long enough justification text."} |
      | justification | {"courseId":"course-001","learnerEmail":"ac5@example.org","justification":"too short"}                  |

  Scenario Outline: B-AC6 a duplicate <status> request returns 409
    Given "<email>" has a "<status>" request for "course-004"
    When "<email>" requests enrollment in "course-004"
    Then the response status is 409
    And the response field "error.code" is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   | email               |
      | pending  | ac6p@example.org    |
      | approved | ac6a@example.org    |

  Scenario: B-AC7 GET by id returns the request with statusHistory
    Given "ac7@example.org" has a "pending" request for "course-005"
    When the client sends GET "/api/enrollment-requests/{id}"
    Then the response status is 200
    And the response field "learnerEmail" is "ac7@example.org"
    And the response field "statusHistory.0.toStatus" is "pending"

  Scenario Outline: B-AC8 list filters by <filter>
    Given "ac8@example.org" has a "approved" request for "course-006"
    When the client sends GET "/api/enrollment-requests?<filter>=<value>"
    Then the response status is 200
    And every item has "<filter>" equal to "<value>"
    And the response field "items.length" is not "0"

    Examples:
      | filter       | value           |
      | status       | approved        |
      | courseId     | course-006      |
      | learnerEmail | ac8@example.org |

  Scenario Outline: B-AC9 PATCH supports <from> to <to>
    Given "<email>" has a "<from>" request for "course-007"
    When the client changes the status to "<to>" with reason "Not needed anymore."
    Then the response status is 200
    And the response field "status" is "<to>"

    Examples:
      | from     | to        | email               |
      | pending  | approved  | ac9a@example.org    |
      | pending  | rejected  | ac9b@example.org    |
      | pending  | cancelled | ac9c@example.org    |
      | approved | cancelled | ac9d@example.org    |

  Scenario Outline: B-AC10 <from> to <to> returns 409
    Given "<email>" has a "<from>" request for "course-009"
    When the client changes the status to "<to>" with reason "Some reason here."
    Then the response status is 409
    And the response field "error.code" is "INVALID_STATUS_TRANSITION"

    Examples:
      | from      | to       | email              |
      | approved  | rejected | ac10a@example.org  |
      | cancelled | approved | ac10b@example.org  |

  Scenario: B-AC11 rejection without a reason returns 400
    Given "ac11@example.org" has a "pending" request for "course-011"
    When the client patches "/api/enrollment-requests/{id}/status" the body '{"status":"rejected","changedBy":"reviewer@example.org"}'
    Then the response status is 400
    And the response field "error.details.0.field" is "reason"

  Scenario: B-AC12 creation and each status change add a statusHistory entry
    Given "ac12@example.org" has a "cancelled" request for "course-012"
    When the client sends GET "/api/enrollment-requests/{id}"
    Then the response field "statusHistory.length" is "3"
    And the response field "statusHistory.0.changedBy" is "system"
    And the response field "statusHistory.2.fromStatus" is "approved"
    And the response field "statusHistory.2.toStatus" is "cancelled"
    And the response field "statusHistory.2.changedBy" is "reviewer@example.org"

  Scenario: B-AC13 existing behaviour still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario Outline: B-AC14 errors use the shared envelope (<code>)
    When the client <method> "<path>" the body '<body>'
    Then the response status is <status>
    And the response field "error.code" is "<code>"

    Examples:
      | method     | path                                    | body                                   | status | code                         |
      | posts to   | /api/enrollment-requests                | {broken                                | 400    | INVALID_REQUEST              |
      | patches    | /api/enrollment-requests/nope/status    | {"status":"approved","changedBy":"r"}  | 404    | ENROLLMENT_REQUEST_NOT_FOUND |
      | patches    | /api/enrollment-requests/nope/status    | {"status":"done","changedBy":"r"}      | 400    | INVALID_REQUEST              |

  Scenario: B-AC15 docs describe every endpoint and error code
    Then the enrollment requests doc mentions every endpoint and error code
