Feature: Enrollment requests

  Scenario: A valid request starts pending and keeps an audit entry
    When the client creates an enrollment request for course "course-001" as "create-pending@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    And the enrollment request status is "pending"
    And the enrollment status history has 1 entries
    And the first enrollment history entry goes from null to "pending" by "system"

  Scenario: A missing course is not found
    When the client creates an enrollment request for course "course-999" as "missing-course@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 404
    And the enrollment error code is "COURSE_NOT_FOUND"

  Scenario: A draft course cannot be requested
    When the client creates an enrollment request for course "course-003" as "draft-course@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "COURSE_NOT_ACTIVE"

  Scenario: A retired course cannot be requested
    When the client creates an enrollment request for course "course-004" as "retired-course@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "COURSE_NOT_ACTIVE"

  Scenario: An invalid email is rejected
    When the client creates an enrollment request for course "course-001" as "not-an-email" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error detail for "learnerEmail" is "learnerEmail must be a valid email address."

  Scenario: A short justification is rejected
    When the client creates an enrollment request for course "course-001" as "short-justification@example.org" with justification "too short"
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error detail for "justification" is "justification must be between 20 and 500 characters."

  Scenario: A second pending request for the same learner and course is rejected
    When the client creates an enrollment request for course "course-002" as "duplicate-pending@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client creates an enrollment request for course "course-002" as "duplicate-pending@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: An approved request blocks a second request
    When the client creates an enrollment request for course "course-006" as "duplicate-approved@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client sets the current enrollment request status to "approved" as "reviewer@example.org"
    And the client creates an enrollment request for course "course-006" as "duplicate-approved@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: Get by id returns the status history
    When the client creates an enrollment request for course "course-008" as "fetch-one@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client fetches the current enrollment request
    Then the enrollment response status is 200
    And the enrollment request status is "pending"
    And the enrollment status history has 1 entries

  Scenario: List filters by status, course, and learner
    When the client creates an enrollment request for course "course-009" as "list-filter@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client creates an enrollment request for course "course-014" as "list-filter@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client sets the current enrollment request status to "approved" as "reviewer@example.org"
    And the client lists enrollment requests with status "pending", course "course-009", and learner "list-filter@example.org"
    Then the enrollment response status is 200
    And the enrollment list has 1 items
    And the enrollment list contains course "course-009"

  Scenario: Pending can be approved and approved can be cancelled
    When the client creates an enrollment request for course "course-013" as "approve-cancel@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client sets the current enrollment request status to "approved" as "reviewer@example.org"
    And the client sets the current enrollment request status to "cancelled" as "reviewer@example.org"
    Then the enrollment response status is 200
    And the enrollment request status is "cancelled"
    And the enrollment status history has 3 entries

  Scenario: Pending can be rejected with a reason
    When the client creates an enrollment request for course "course-001" as "reject-reason@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client rejects the current enrollment request as "reviewer@example.org" because "Learner has not completed the prerequisite course."
    Then the enrollment response status is 200
    And the enrollment request status is "rejected"
    And the last enrollment history reason is "Learner has not completed the prerequisite course."

  Scenario: Pending can be cancelled
    When the client creates an enrollment request for course "course-002" as "cancel-pending@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client sets the current enrollment request status to "cancelled" as "learner@example.org"
    Then the enrollment response status is 200
    And the enrollment request status is "cancelled"
    And the enrollment status history has 2 entries

  Scenario: An approved request cannot be rejected
    When the client creates an enrollment request for course "course-008" as "bad-transition@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client sets the current enrollment request status to "approved" as "reviewer@example.org"
    And the client rejects the current enrollment request as "reviewer@example.org" because "Too late to reject."
    Then the enrollment response status is 409
    And the enrollment error code is "INVALID_STATUS_TRANSITION"

  Scenario: Rejection without a reason is rejected
    When the client creates an enrollment request for course "course-009" as "missing-reason@example.org" with justification "I need this course to prepare for upcoming secure development work."
    And the client sets the current enrollment request status to "rejected" as "reviewer@example.org"
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error detail for "reason" is "reason is required when status is rejected."

  Scenario: A missing request id is not found
    When the client fetches enrollment request "enroll-does-not-exist"
    Then the enrollment response status is 404
    And the enrollment error code is "ENROLLMENT_REQUEST_NOT_FOUND"
