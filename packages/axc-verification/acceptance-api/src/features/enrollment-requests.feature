Feature: Enrollment requests

  Scenario: Create a pending enrollment request
    When the client creates an enrollment request for course "000000000000000000000003" learner "new.learner@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    And the enrollment response status field is "pending"
    And the enrollment history count is 1
    And the enrollment history entry 1 goes to "pending" from "" by "system"

  Scenario: Missing course is not found
    When the client creates an enrollment request for course "000000000000000000000099" learner "missing.course@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 404
    And the enrollment error code is "COURSE_NOT_FOUND"

  Scenario: Draft course is not active
    When the client creates an enrollment request for course "000000000000000000000004" learner "draft.course@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "COURSE_NOT_ACTIVE"

  Scenario: Retired course is not active
    When the client creates an enrollment request for course "000000000000000000000006" learner "retired.course@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "COURSE_NOT_ACTIVE"

  Scenario: Invalid learner email
    When the client creates an enrollment request for course "000000000000000000000003" learner "not-an-email" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error field is "learnerEmail"

  Scenario: Justification is too short
    When the client creates an enrollment request for course "000000000000000000000003" learner "short.note@example.org" and justification "Too short"
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error field is "justification"

  Scenario: Duplicate pending request is rejected
    When the client creates an enrollment request for course "000000000000000000000002" learner "learner@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: Duplicate approved request is rejected
    When the client creates an enrollment request for course "000000000000000000000005" learner "approved.learner@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "approved" by "reviewer@example.org" because ""
    Then the enrollment response status is 200
    When the client creates an enrollment request for course "000000000000000000000005" learner "approved.learner@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: Retrieve an enrollment request by id
    When the client reads enrollment request "000000000000000000000001"
    Then the enrollment response status is 200
    And the enrollment response id is "000000000000000000000001"
    And the enrollment history count is 1

  Scenario: Missing enrollment request
    When the client reads enrollment request "000000000000000000000088"
    Then the enrollment response status is 404
    And the enrollment error code is "ENROLLMENT_REQUEST_NOT_FOUND"

  Scenario: Filter enrollment requests by status course and learner
    When the client lists enrollment requests with "?status=pending&courseId=000000000000000000000002&learnerEmail=learner@example.org"
    Then the enrollment response status is 200
    And the enrollment list count is 1
    And the enrollment list contains learner "learner@example.org"

  Scenario: Filter enrollment requests by status
    When the client lists enrollment requests with "?status=pending"
    Then the enrollment response status is 200
    And every listed enrollment status is "pending"

  Scenario: Invalid list status
    When the client lists enrollment requests with "?status=nope"
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"

  Scenario: Approve a pending request
    When the client creates an enrollment request for course "000000000000000000000003" learner "approve.me@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "approved" by "reviewer@example.org" because ""
    Then the enrollment response status is 200
    And the enrollment response status field is "approved"
    And the enrollment history count is 2
    And the enrollment history entry 2 goes to "approved" from "pending" by "reviewer@example.org"

  Scenario: Reject a pending request
    When the client creates an enrollment request for course "000000000000000000000003" learner "reject.me@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "rejected" by "reviewer@example.org" because "Learner has not completed the prerequisite course."
    Then the enrollment response status is 200
    And the enrollment response status field is "rejected"
    And the enrollment history count is 2
    And the enrollment history entry 2 reason is "Learner has not completed the prerequisite course."

  Scenario: Cancel a pending request
    When the client creates an enrollment request for course "000000000000000000000003" learner "cancel.pending@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "cancelled" by "reviewer@example.org" because ""
    Then the enrollment response status is 200
    And the enrollment response status field is "cancelled"
    And the enrollment history count is 2

  Scenario: Cancel an approved request
    When the client creates an enrollment request for course "000000000000000000000003" learner "cancel.approved@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "approved" by "reviewer@example.org" because ""
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "cancelled" by "reviewer@example.org" because ""
    Then the enrollment response status is 200
    And the enrollment response status field is "cancelled"
    And the enrollment history count is 3

  Scenario: Invalid status transition
    When the client creates an enrollment request for course "000000000000000000000003" learner "bad.transition@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "pending" by "reviewer@example.org" because ""
    Then the enrollment response status is 409
    And the enrollment error code is "INVALID_STATUS_TRANSITION"

  Scenario: Rejection requires a reason
    When the client creates an enrollment request for course "000000000000000000000003" learner "no.reason@example.org" and justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 200
    When the client updates the last enrollment request to "rejected" by "reviewer@example.org" because ""
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error field is "reason"

  Scenario: Invalid status value
    When the client updates enrollment request "000000000000000000000001" to "archived" by "reviewer@example.org" because ""
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
