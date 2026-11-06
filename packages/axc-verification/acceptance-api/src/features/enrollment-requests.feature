Feature: Course search and enrollment requests

  Scenario: B-AC1 course search from Task Set A still works
    When the client GETs "/api/courses?q=SECURITY&modality=online&status=active&page=1&pageSize=5&sort=title"
    Then the response status is 200
    And the response has:
      | page        | 1          |
      | pageSize    | 5          |
      | totalItems  | 1          |
      | items.0.id  | course-001 |
    When the client GETs "/api/courses?pageSize=51"
    Then the response status is 400
    And the response has:
      | error.code | INVALID_QUERY_PARAMETER |

  Scenario: B-AC2 a valid request is created as pending
    When "ac2@example.org" requests enrollment in "course-001"
    Then the response status is 201
    And the response has:
      | status                     | pending         |
      | learnerEmail               | ac2@example.org |
      | courseId                   | course-001      |
      | statusHistory.0.fromStatus | null            |
      | statusHistory.0.toStatus   | pending         |

  Scenario: B-AC3 a missing course returns 404
    When "ac3@example.org" requests enrollment in "course-999"
    Then the response status is 404
    And the response has:
      | error.code | COURSE_NOT_FOUND |

  Scenario Outline: B-AC4 a <status> course returns 409
    When "ac4@example.org" requests enrollment in "<course>"
    Then the response status is 409
    And the response has:
      | error.code | COURSE_NOT_ACTIVE |

    Examples:
      | status  | course     |
      | draft   | course-005 |
      | retired | course-006 |

  Scenario Outline: B-AC5 invalid <field> returns 400
    When "<email>" requests enrollment in "course-001" with justification "<justification>"
    Then the response status is 400
    And the response has:
      | error.code             | INVALID_REQUEST |
      | error.details.0.field  | <field>         |

    Examples:
      | field         | email           | justification                         |
      | learnerEmail  | not-an-email    | A long enough justification for this. |
      | justification | ac5@example.org | too short                             |

  Scenario: B-AC6 duplicate pending or approved requests return 409
    Given "ac6@example.org" has a request for "course-002"
    When "ac6@example.org" requests enrollment in "course-002"
    Then the response status is 409
    And the response has:
      | error.code | DUPLICATE_ACTIVE_REQUEST |
    When the request status is changed to "approved" by "reviewer@example.org"
    And "ac6@example.org" requests enrollment in "course-002"
    Then the response status is 409

  Scenario: B-AC7 a request is retrieved by id with its status history
    Given "ac7@example.org" has a request for "course-001"
    When the client GETs "/api/enrollment-requests/{id}"
    Then the response status is 200
    And the response has:
      | id                       | {id}    |
      | statusHistory.length     | 1       |
      | statusHistory.0.toStatus | pending |

  Scenario: B-AC8 requests are filtered by status, courseId and learnerEmail
    Given "ac8@example.org" has a request for "course-003"
    And "ac8@example.org" has a request for "course-004"
    When the client GETs "/api/enrollment-requests?status=pending&courseId=course-003&learnerEmail=ac8@example.org"
    Then the response status is 200
    And the response has:
      | items.length          | 1          |
      | items.0.courseId      | course-003 |
    When the client GETs "/api/enrollment-requests?status=approved&learnerEmail=ac8@example.org"
    Then the response has:
      | items.length | 0 |

  Scenario Outline: B-AC9 pending moves to <status>
    Given "ac9-<status>@example.org" has a request for "course-001"
    When the request status is changed to "<status>" by "reviewer@example.org" because "Prerequisite missing."
    Then the response status is 200
    And the response has:
      | status | <status> |

    Examples:
      | status    |
      | approved  |
      | rejected  |
      | cancelled |

  Scenario: B-AC9 approved moves to cancelled
    Given "ac9b@example.org" has a request for "course-001"
    When the request status is changed to "approved" by "reviewer@example.org"
    And the request status is changed to "cancelled" by "ac9b@example.org"
    Then the response status is 200
    And the response has:
      | status | cancelled |

  Scenario: B-AC10 an invalid transition returns 409
    Given "ac10@example.org" has a request for "course-001"
    When the request status is changed to "rejected" by "reviewer@example.org" because "Not eligible."
    And the request status is changed to "approved" by "reviewer@example.org"
    Then the response status is 409
    And the response has:
      | error.code | INVALID_STATUS_TRANSITION |

  Scenario: B-AC11 rejection without a reason returns 400
    Given "ac11@example.org" has a request for "course-001"
    When the request status is changed to "rejected" by "reviewer@example.org"
    Then the response status is 400
    And the response has:
      | error.code            | INVALID_REQUEST |
      | error.details.0.field | reason          |

  Scenario: B-AC12 creation and every status change add a history entry
    Given "ac12@example.org" has a request for "course-001"
    When the request status is changed to "approved" by "reviewer@example.org"
    And the request status is changed to "cancelled" by "ops@example.org"
    And the client GETs "/api/enrollment-requests/{id}"
    Then the response has:
      | statusHistory.length       | 3               |
      | statusHistory.1.fromStatus | pending         |
      | statusHistory.1.toStatus   | approved        |
      | statusHistory.2.fromStatus | approved        |
      | statusHistory.2.changedBy  | ops@example.org |

  Scenario: B-AC13 existing behaviour still works
    When the client GETs "/health"
    Then the response status is 200
    And the response has:
      | status | ok |

  Scenario: B-AC14 error handling covers unknown ids and invalid status values
    When the client GETs "/api/enrollment-requests/does-not-exist"
    Then the response status is 404
    And the response has:
      | error.code | ENROLLMENT_REQUEST_NOT_FOUND |
    Given "ac14@example.org" has a request for "course-001"
    When the request status is changed to "finished" by "reviewer@example.org"
    Then the response status is 400
    And the response has:
      | error.code | INVALID_REQUEST |

  Scenario: B-AC15 docs describe every endpoint and error case
    Then the "enrollment-requests" docs page mentions:
      | POST /api/enrollment-requests                |
      | GET /api/enrollment-requests/{id}            |
      | GET /api/enrollment-requests                 |
      | PATCH /api/enrollment-requests/{id}/status   |
      | COURSE_NOT_FOUND                             |
      | COURSE_NOT_ACTIVE                            |
      | INVALID_REQUEST                              |
      | DUPLICATE_ACTIVE_REQUEST                     |
      | ENROLLMENT_REQUEST_NOT_FOUND                 |
      | INVALID_STATUS_TRANSITION                    |
    And the "courses" docs page mentions:
      | GET /api/courses        |
      | INVALID_QUERY_PARAMETER |
