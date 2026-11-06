Feature: Enrollment requests

  Scenario: A valid request starts pending
    When the client creates an enrollment request for course "course-001" as "pending-create@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    And the enrollment request status value is "pending"
    And the enrollment history has 1 entries
    And the first enrollment history entry is the initial pending entry

  Scenario: A missing course returns 404
    When the client creates an enrollment request for course "course-missing" as "missing-course@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 404
    And the enrollment error code is "COURSE_NOT_FOUND"

  Scenario: A draft or retired course returns 409
    When the client creates an enrollment request for course "course-003" as "draft-course@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "COURSE_NOT_ACTIVE"
    When the client creates an enrollment request for course "course-004" as "retired-course@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "COURSE_NOT_ACTIVE"

  Scenario: Invalid email and short justification return 400
    When the client creates an enrollment request for course "course-001" as "not-an-email" with justification "too short"
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error includes field "learnerEmail"
    And the enrollment error includes field "justification"

  Scenario: A learner cannot open a second pending or approved request
    When the client creates an enrollment request for course "course-001" as "duplicate-pending@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client creates an enrollment request for course "course-001" as "duplicate-pending@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "DUPLICATE_ACTIVE_REQUEST"
    When the client creates an enrollment request for course "course-002" as "duplicate-approved@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client sets the enrollment request status to "approved" as "reviewer@example.org"
    Then the enrollment response status is 200
    When the client creates an enrollment request for course "course-002" as "duplicate-approved@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 409
    And the enrollment error code is "DUPLICATE_ACTIVE_REQUEST"

  Scenario: Get by id returns the status history
    When the client creates an enrollment request for course "course-001" as "read-one@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client reads the enrollment request
    Then the enrollment response status is 200
    And the enrollment request status value is "pending"
    And the enrollment history has 1 entries

  Scenario: List filters by status, course, and learner
    When the client creates an enrollment request for course "course-001" as "filter-ada@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client creates an enrollment request for course "course-002" as "filter-bea@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client lists enrollment requests with query "status=pending&courseId=course-001&learnerEmail=filter-ada@example.org"
    Then the enrollment response status is 200
    And the enrollment list includes learner "filter-ada@example.org"
    And the enrollment list has 1 requests

  Scenario: Pending requests can be approved, rejected, or cancelled, and approved requests can be cancelled
    When the client creates an enrollment request for course "course-005" as "transition-approve@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client sets the enrollment request status to "approved" as "reviewer@example.org"
    Then the enrollment response status is 200
    And the enrollment request status value is "approved"
    And the enrollment history has 2 entries
    When the client sets the enrollment request status to "cancelled" as "reviewer@example.org"
    Then the enrollment response status is 200
    And the enrollment request status value is "cancelled"
    And the enrollment history has 3 entries
    When the client creates an enrollment request for course "course-008" as "transition-reject@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client rejects the enrollment request as "reviewer@example.org" because "Learner has not completed the prerequisite course."
    Then the enrollment response status is 200
    And the enrollment request status value is "rejected"
    And the last enrollment history reason is "Learner has not completed the prerequisite course."
    When the client creates an enrollment request for course "course-009" as "transition-cancel@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client sets the enrollment request status to "cancelled" as "learner@example.org"
    Then the enrollment response status is 200
    And the enrollment request status value is "cancelled"

  Scenario: An invalid transition returns 409
    When the client creates an enrollment request for course "course-011" as "invalid-transition@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client rejects the enrollment request as "reviewer@example.org" because "Prerequisite is missing from the learner record."
    Then the enrollment response status is 200
    When the client sets the enrollment request status to "approved" as "reviewer@example.org"
    Then the enrollment response status is 409
    And the enrollment error code is "INVALID_STATUS_TRANSITION"
    When the client reads the enrollment request
    Then the enrollment response status is 200
    And the enrollment request status value is "rejected"
    And the enrollment history has 2 entries

  Scenario: Rejection without a reason returns 400
    When the client creates an enrollment request for course "course-013" as "missing-reason@example.org" with justification "I need this course to prepare for upcoming secure development work."
    Then the enrollment response status is 201
    When the client sets the enrollment request status to "rejected" as "reviewer@example.org"
    Then the enrollment response status is 400
    And the enrollment error code is "INVALID_REQUEST"
    And the enrollment error includes field "reason"
    When the client reads the enrollment request
    Then the enrollment response status is 200
    And the enrollment history has 1 entries

  Scenario: A missing enrollment request returns 404
    When the client reads enrollment request "enroll-does-not-exist"
    Then the enrollment response status is 404
    And the enrollment error code is "ENROLLMENT_REQUEST_NOT_FOUND"
