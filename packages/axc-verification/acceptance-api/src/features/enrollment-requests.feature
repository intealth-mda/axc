Feature: Course enrollment requests

  Scenario: A created request is approved and keeps its audit trail
    When learner "approve-flow@example.org" requests enrollment in course "course-001"
    Then the enrollment API responds with status 201
    And the enrollment request has status "pending" and 1 history entry
    When reviewer "reviewer@example.org" changes the enrollment request status to "approved"
    Then the enrollment API responds with status 200
    When the client fetches the enrollment request
    Then the enrollment API responds with status 200
    And the enrollment request has status "approved" and 2 history entries
    And history entry 2 moved from "pending" to "approved" by "reviewer@example.org"

  Scenario: An invalid status transition is rejected
    When learner "cancel-flow@example.org" requests enrollment in course "course-002"
    And reviewer "reviewer@example.org" changes the enrollment request status to "cancelled"
    And reviewer "reviewer@example.org" changes the enrollment request status to "approved"
    Then the enrollment API responds with status 409
    And the enrollment error code is "INVALID_STATUS_TRANSITION"

  Scenario: A request for a missing course is not found
    When learner "missing-course@example.org" requests enrollment in course "course-999"
    Then the enrollment API responds with status 404
    And the enrollment error code is "COURSE_NOT_FOUND"
