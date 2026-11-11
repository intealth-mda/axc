Feature: Enrollment requests

  # ac-meta: B-AC13
  # ac-meta: B-AC14
  # ac-meta: B-AC15

  Scenario: B-AC1 course search still returns the default page
    When the client requests the course catalog
    Then the courses search responds with status 200
    And the courses page is 1
    And the courses page size is 10

  Scenario: B-AC2 a valid enrollment request starts pending
    When the client creates an enrollment request for course "course-001"
    Then the enrollment call responds with status 201
    And the enrollment request status is "pending"
    And the enrollment status history has 1 entries ending in "pending"

  Scenario: B-AC3 a missing course returns 404
    When the client creates an enrollment request for course "course-missing"
    Then the enrollment error has status 404 and code "COURSE_NOT_FOUND"

  Scenario: B-AC4 a draft or retired course returns 409
    When the client creates an enrollment request for course "course-003"
    Then the enrollment error has status 409 and code "COURSE_NOT_ACTIVE"
    When the client creates an enrollment request for course "course-005"
    Then the enrollment error has status 409 and code "COURSE_NOT_ACTIVE"

  Scenario: B-AC5 invalid email or short justification returns 400
    When the client submits an enrollment request with email "not-an-email" and justification "too short" for course "course-001"
    Then the enrollment error has status 400 and code "INVALID_REQUEST"
    And the enrollment error fields are "justification,learnerEmail"

  Scenario: B-AC6 duplicate pending or approved requests return 409
    When the client creates an enrollment request for course "course-001"
    And the client repeats the enrollment request
    Then the enrollment error has status 409 and code "DUPLICATE_ACTIVE_REQUEST"
    When the client creates an enrollment request for course "course-002"
    And the client sets the enrollment status to "approved"
    And the client repeats the enrollment request
    Then the enrollment error has status 409 and code "DUPLICATE_ACTIVE_REQUEST"

  Scenario: B-AC7 get by id returns the request and its status history
    When the client creates an enrollment request for course "course-007"
    And the client reads the enrollment request
    Then the enrollment call responds with status 200
    And the enrollment request status is "pending"
    And the enrollment status history has 1 entries ending in "pending"

  Scenario: B-AC8 list filters by status, course, and learner
    When the client creates an enrollment request for course "course-006"
    And the client sets the enrollment status to "cancelled"
    And the client lists enrollment requests with those filters and status "cancelled"
    Then the enrollment call responds with status 200
    And the enrollment list contains the request

  Scenario: B-AC9 valid status transitions succeed
    When the client creates an enrollment request for course "course-001"
    And the client sets the enrollment status to "approved"
    Then the enrollment request status is "approved"
    When the client creates an enrollment request for course "course-002"
    And the client sets the enrollment status to "rejected" because "Learner has not completed the prerequisite course."
    Then the enrollment request status is "rejected"
    When the client creates an enrollment request for course "course-006"
    And the client sets the enrollment status to "cancelled"
    Then the enrollment request status is "cancelled"
    When the client creates an enrollment request for course "course-007"
    And the client sets the enrollment status to "approved"
    And the client sets the enrollment status to "cancelled"
    Then the enrollment request status is "cancelled"
    And the enrollment status history has 3 entries ending in "cancelled"

  Scenario: B-AC10 an invalid status transition returns 409
    When the client creates an enrollment request for course "course-002"
    And the client sets the enrollment status to "approved"
    And the client sets the enrollment status to "rejected" because "This transition is not allowed."
    Then the enrollment error has status 409 and code "INVALID_STATUS_TRANSITION"

  Scenario: B-AC11 rejection requires a reason
    When the client creates an enrollment request for course "course-007"
    And the client sets the enrollment status to "rejected" because ""
    Then the enrollment error has status 400 and code "INVALID_REQUEST"
    And the enrollment error fields are "reason"

  Scenario: B-AC12 creation and status changes append status history
    When the client creates an enrollment request for course "course-001"
    Then the enrollment status history has 1 entries ending in "pending"
    When the client sets the enrollment status to "approved"
    Then the enrollment status history has 2 entries ending in "approved"
    And the enrollment history starts from "pending"
