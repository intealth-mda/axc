Feature: Enrollment requests

  Scenario Outline: B-AC1 course search from Task Set A still works (<path>)
    When the client requests "<path>"
    Then the response status is <status>

    Examples:
      | path                                                      | status |
      | /api/courses                                              | 200    |
      | /api/courses?q=security&modality=online&status=active     | 200    |
      | /api/courses?tag=ai&page=1&pageSize=5&sort=createdAt      | 200    |
      | /api/courses?modality=space                               | 400    |
      | /api/courses?pageSize=51                                  | 400    |

  Scenario: B-AC2 a valid request is created as pending
    When the client creates an enrollment request for course "course-001"
    Then the response status is 201
    And the response field "status" is "pending"

  Scenario: B-AC3 a missing course returns 404
    When the client creates an enrollment request for course "course-999"
    Then the response status is 404
    And the error code is "COURSE_NOT_FOUND"

  Scenario Outline: B-AC4 a <state> course returns 409
    When the client creates an enrollment request for course "<course>"
    Then the response status is 409
    And the error code is "COURSE_NOT_ACTIVE"

    Examples:
      | state   | course     |
      | draft   | course-004 |
      | retired | course-005 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When the client creates an enrollment request with email "<email>" and justification "<justification>"
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

    Examples:
      | field         | email           | justification                       |
      | learnerEmail  | not-an-email    | I need this course for my work now. |
      | justification | ok@example.org  | too short                           |

  Scenario Outline: B-AC6 a duplicate <status> request returns 409
    Given a <status> enrollment request exists for course "course-002"
    When the client creates the same enrollment request again
    Then the response status is 409
    And the error code is "DUPLICATE_ACTIVE_REQUEST"

    Examples:
      | status   |
      | pending  |
      | approved |

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given a pending enrollment request exists for course "course-001"
    When the client fetches the enrollment request
    Then the response status is 200
    And the status history has 1 entries

  Scenario: B-AC8 requests are filtered by status, courseId and learnerEmail
    Given a pending enrollment request exists for course "course-006"
    When the client lists enrollment requests by status "pending", the course and the learner
    Then the response status is 200
    And the list holds only the enrollment request

  Scenario Outline: B-AC9 valid transition <from> to <to>
    Given a <from> enrollment request exists for course "course-007"
    When the client changes the status to "<to>" with reason "Scheduling conflict for this learner."
    Then the response status is 200
    And the response field "status" is "<to>"

    Examples:
      | from     | to        |
      | pending  | approved  |
      | pending  | rejected  |
      | pending  | cancelled |
      | approved | cancelled |

  Scenario Outline: B-AC10 invalid transition <from> to <to> returns 409
    Given a <from> enrollment request exists for course "course-003"
    When the client changes the status to "<to>" with reason "Some reason."
    Then the response status is 409
    And the error code is "INVALID_STATUS_TRANSITION"

    Examples:
      | from      | to       |
      | approved  | rejected |
      | cancelled | approved |
      | pending   | pending  |

  Scenario: B-AC11 rejection without a reason returns 400
    Given a pending enrollment request exists for course "course-001"
    When the client changes the status to "rejected" without a reason
    Then the response status is 400
    And the error code is "INVALID_REQUEST"

  Scenario: B-AC12 creation and every status change add a status history entry
    Given a pending enrollment request exists for course "course-002"
    When the client changes the status to "approved" with reason "Prerequisites met."
    And the client changes the status to "cancelled" with reason "Learner withdrew."
    Then the status history has 3 entries
    And the last history entry goes from "approved" to "cancelled"

  Scenario: B-AC13 existing behaviour still passes
    When the client requests "/health"
    Then the response status is 200

  Scenario Outline: B-AC14 error handling covers <case>
    When the client requests "<path>"
    Then the response status is <status>
    And the error code is "<code>"

    Examples:
      | case               | path                                     | status | code                         |
      | unknown request id | /api/enrollment-requests/does-not-exist  | 404    | ENROLLMENT_REQUEST_NOT_FOUND |
      | invalid filter     | /api/enrollment-requests?status=done     | 400    | INVALID_REQUEST              |

  Scenario Outline: B-AC15 documentation describes <item>
    Then the docs page "enrollment-requests" mentions "<item>"

    Examples:
      | item                                  |
      | POST /api/enrollment-requests         |
      | GET /api/enrollment-requests/:id      |
      | GET /api/enrollment-requests          |
      | PATCH /api/enrollment-requests/:id/status |
      | statusHistory                         |
      | COURSE_NOT_FOUND                      |
      | COURSE_NOT_ACTIVE                     |
      | DUPLICATE_ACTIVE_REQUEST              |
      | ENROLLMENT_REQUEST_NOT_FOUND          |
      | INVALID_STATUS_TRANSITION             |
      | INVALID_REQUEST                       |
