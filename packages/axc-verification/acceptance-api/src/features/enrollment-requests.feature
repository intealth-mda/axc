Feature: Course search and enrollment requests

  Scenario: B-AC1 course search from Task Set A still works
    When the client sends GET "/api/courses?q=SECURITY&status=active&modality=online"
    Then the response status is 200
    And the response field "totalItems" is "1"
    And the response field "items.0.id" is "course-001"
    When the client sends GET "/api/courses?page=1&pageSize=5&sort=createdAt"
    Then the response field "items.length" is "5"
    And the items are sorted by "createdAt"
    When the client sends GET "/api/courses?pageSize=51"
    Then the response status is 400
    And the response field "error.code" is "INVALID_QUERY_PARAMETER"

  Scenario: B-AC2 a valid request is created pending
    When "ac2@example.org" requests enrollment in "course-001"
    Then the response status is 201
    And the response field "status" is "pending"
    And the response field "learnerEmail" is "ac2@example.org"

  Scenario: B-AC3 a missing course returns 404
    When "ac3@example.org" requests enrollment in "course-999"
    Then the response status is 404
    And the response field "error.code" is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a <status> course returns 409
    When "ac4@example.org" requests enrollment in "<course>"
    Then the response status is 409
    And the response field "error.code" is "COURSE_NOT_ACTIVE"

    Examples:
      | status  | course     |
      | draft   | course-004 |
      | retired | course-005 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the client posts an enrollment request with email "<email>" and justification "<justification>"
    Then the response status is 400
    And the response field "error.code" is "INVALID_REQUEST"
    And the response field "error.details.0.field" is "<field>"

    Examples:
      | field         | email           | justification                     |
      | learnerEmail  | not-an-email    | I need this for my upcoming work. |
      | justification | ac5@example.org | too short                         |

  Scenario Outline: B-AC6 a duplicate <status> request returns 409
    Given "<email>" has a "<status>" request for "course-002"
    When "<email>" requests enrollment in "course-002"
    Then the response status is 409
    And the response field "error.code" is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   | email              |
      | pending  | ac6p@example.org   |
      | approved | ac6a@example.org   |

  Scenario: B-AC7 a request is retrieved by id with its history
    Given "ac7@example.org" has a "pending" request for "course-001"
    When the client sends GET "/api/enrollment-requests/{id}"
    Then the response status is 200
    And the response field "learnerEmail" is "ac7@example.org"
    And the response field "statusHistory.0.toStatus" is "pending"
    When the client sends GET "/api/enrollment-requests/enroll-999"
    Then the response status is 404
    And the response field "error.code" is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: B-AC8 requests are filtered by status, courseId and learnerEmail
    Given "ac8@example.org" has a "approved" request for "course-003"
    And "ac8@example.org" has a "pending" request for "course-006"
    When the client sends GET "/api/enrollment-requests?learnerEmail=ac8@example.org"
    Then the response field "items.length" is "2"
    When the client sends GET "/api/enrollment-requests?learnerEmail=ac8@example.org&status=approved&courseId=course-003"
    Then the response field "items.length" is "1"
    And every item has "status" equal to "approved"
    When the client sends GET "/api/enrollment-requests?courseId=course-006"
    Then every item has "courseId" equal to "course-006"

  Scenario Outline: B-AC9 <from> to <to> is allowed
    Given "<email>" has a "<from>" request for "course-001"
    When the reviewer changes the status to "<to>" with reason "Not eligible this term."
    Then the response status is 200
    And the response field "status" is "<to>"

    Examples:
      | from     | to        | email             |
      | pending  | approved  | ac9a@example.org  |
      | pending  | rejected  | ac9b@example.org  |
      | pending  | cancelled | ac9c@example.org  |
      | approved | cancelled | ac9d@example.org  |

  Scenario: B-AC10 an invalid transition returns 409
    Given "ac10@example.org" has a "rejected" request for "course-001"
    When the reviewer changes the status to "approved" with reason ""
    Then the response status is 409
    And the response field "error.code" is "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection requires a reason
    Given "ac11@example.org" has a "pending" request for "course-001"
    When the reviewer changes the status to "rejected" with reason ""
    Then the response status is 400
    And the response field "error.details.0.field" is "reason"

  Scenario: B-AC12 creation and each status change add a history entry
    Given "ac12@example.org" has a "approved" request for "course-001"
    When the reviewer changes the status to "cancelled" with reason ""
    Then the response field "statusHistory.length" is "3"
    And the response field "statusHistory.0.fromStatus" is "null"
    And the response field "statusHistory.1.toStatus" is "approved"
    And the response field "statusHistory.2.fromStatus" is "approved"
    And the response field "statusHistory.2.changedBy" is "reviewer@example.org"

  Scenario: B-AC13 existing tests still pass
    When the client sends GET "/health"
    Then the response status is 200
    And the response field "status" is "ok"

  Scenario: B-AC14 an unknown status value is rejected as an error case
    Given "ac14@example.org" has a "pending" request for "course-001"
    When the reviewer changes the status to "archived" with reason ""
    Then the response status is 400
    And the response field "error.details.0.field" is "status"

  Scenario: B-AC15 docs describe all endpoints and error cases
    Then the docs page "enrollment-requests.md" mentions "POST /api/enrollment-requests, GET /api/enrollment-requests/:id, GET /api/enrollment-requests, PATCH /api/enrollment-requests/:id/status, COURSE_NOT_FOUND, COURSE_NOT_ACTIVE, DUPLICATE_ACTIVE_REQUEST, ENROLLMENT_REQUEST_NOT_FOUND, INVALID_STATUS_TRANSITION, INVALID_REQUEST"
    And the docs page "courses.md" mentions "GET /api/courses, INVALID_QUERY_PARAMETER"
