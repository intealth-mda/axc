Feature: Course search and enrollment requests

  Scenario: B-AC1 course search from Task Set A still works
    When the client sends GET "/api/courses?q=security&status=active&pageSize=5"
    Then the response status is 200
    And every item has "status" equal to "active"
    When the client sends GET "/api/courses?pageSize=51"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"

  Scenario: B-AC2 a valid request creates a pending enrollment request
    When the client creates an enrollment request for "course-001" as "ac2@example.org"
    Then the response status is 201
    And the response field "status" equals "pending"
    And the response field "learnerEmail" equals "ac2@example.org"

  Scenario: B-AC3 a missing course returns 404
    When the client creates an enrollment request for "course-999" as "ac3@example.org"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a <status> course returns 409
    When the client creates an enrollment request for "<course>" as "ac4@example.org"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | status  | course     |
      | draft   | course-002 |
      | retired | course-003 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the client posts an enrollment request with email "<email>" and justification "<justification>"
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error detail field is "<field>"

    Examples:
      | field         | email           | justification                            |
      | learnerEmail  | not-an-email    | I need this course for my upcoming work. |
      | justification | ac5@example.org | too short                                |

  Scenario Outline: B-AC6 a duplicate <status> request returns 409
    Given an enrollment request for "course-004" as "<email>" in status "<status>"
    When the client creates an enrollment request for "course-004" as "<email>"
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   | email            |
      | pending  | ac6p@example.org |
      | approved | ac6a@example.org |

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given an enrollment request for "course-005" as "ac7@example.org" in status "pending"
    When the client sends GET "/api/enrollment-requests/{id}"
    Then the response status is 200
    And the response field "id" equals the created id
    And the status history has 1 entries

  Scenario Outline: B-AC8 requests are filtered by <field>
    Given an enrollment request for "course-006" as "ac8@example.org" in status "approved"
    When the client sends GET "/api/enrollment-requests?<field>=<value>"
    Then the response status is 200
    And there is at least one item
    And every item has "<field>" equal to "<value>"

    Examples:
      | field        | value           |
      | status       | approved        |
      | courseId     | course-006      |
      | learnerEmail | ac8@example.org |

  Scenario Outline: B-AC9 valid transition <from> to <to>
    Given an enrollment request for "course-008" as "<email>" in status "<from>"
    When the reviewer changes the status to "<to>" with reason "Reviewed by the training team."
    Then the response status is 200
    And the response field "status" equals "<to>"

    Examples:
      | from     | to        | email             |
      | pending  | approved  | ac9a@example.org  |
      | pending  | rejected  | ac9b@example.org  |
      | pending  | cancelled | ac9c@example.org  |
      | approved | cancelled | ac9d@example.org  |

  Scenario Outline: B-AC10 invalid transition <from> to <to> returns 409
    Given an enrollment request for "course-009" as "<email>" in status "<from>"
    When the reviewer changes the status to "<to>" with reason "Reviewed by the training team."
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

    Examples:
      | from      | to       | email              |
      | rejected  | approved | ac10a@example.org  |
      | cancelled | approved | ac10b@example.org  |
      | approved  | pending  | ac10c@example.org  |

  Scenario: B-AC11 rejection without a reason returns 400
    Given an enrollment request for "course-010" as "ac11@example.org" in status "pending"
    When the reviewer changes the status to "rejected" with reason ""
    Then the response status is 400
    And the error code is "INVALID_REQUEST"
    And the error detail field is "reason"

  Scenario: B-AC12 creation and every status change add a history entry
    Given an enrollment request for "course-012" as "ac12@example.org" in status "approved"
    When the reviewer changes the status to "cancelled" with reason "Plans changed."
    Then the status history has 3 entries
    When the client sends GET "/api/enrollment-requests/{id}"
    Then the status history has 3 entries

  Scenario: B-AC13 existing behaviour still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario Outline: B-AC14 error handling: <case>
    When the client sends <method> "<path>"
    Then the response status is <code>
    And the error code is "<error>"

    Examples:
      | case               | method | path                                           | code | error                        |
      | unknown request    | GET    | /api/enrollment-requests/missing               | 404  | ENROLLMENT_REQUEST_NOT_FOUND |
      | bad status filter  | GET    | /api/enrollment-requests?status=done           | 400  | INVALID_REQUEST              |
      | unknown on patch   | PATCH  | /api/enrollment-requests/missing/status        | 404  | ENROLLMENT_REQUEST_NOT_FOUND |

  Scenario Outline: B-AC15 docs describe <text>
    Then the doc "<doc>" mentions "<text>"

    Examples:
      | doc                 | text                                  |
      | enrollment-requests | POST /api/enrollment-requests         |
      | enrollment-requests | GET /api/enrollment-requests/{id}     |
      | enrollment-requests | GET /api/enrollment-requests          |
      | enrollment-requests | PATCH /api/enrollment-requests/{id}/status |
      | enrollment-requests | DUPLICATE_ACTIVE_REQUEST              |
      | enrollment-requests | INVALID_STATUS_TRANSITION             |
      | enrollment-requests | statusHistory                         |
      | courses             | GET /api/courses                      |
      | courses             | INVALID_QUERY_PARAMETER               |
