Feature: Enrollment workflow
 Scenario: B-AC2 Pending creation
  When a valid enrollment is submitted
  Then the enrollment is pending with 1 creation history entries
 Scenario: B-AC3 Course missing
  When an enrollment is submitted with field "courseId" set to "missing"
  Then the workflow responds with 404 and error "COURSE_NOT_FOUND"
 Scenario: B-AC4 Course course-004
  When an enrollment is submitted with field "courseId" set to "course-004"
  Then the workflow responds with 409 and error "COURSE_NOT_ACTIVE"
 Scenario: B-AC4 Course course-005
  When an enrollment is submitted with field "courseId" set to "course-005"
  Then the workflow responds with 409 and error "COURSE_NOT_ACTIVE"
 Scenario: B-AC5 Invalid learnerEmail
  When an enrollment is submitted with field "learnerEmail" set to "bad"
  Then the workflow responds with 400 and error "INVALID_REQUEST"
 Scenario: B-AC5 Invalid justification
  When an enrollment is submitted with field "justification" set to "too short"
  Then the workflow responds with 400 and error "INVALID_REQUEST"
 Scenario: B-AC6 Duplicate pending
  Given an enrollment in status "pending"
  When the same learner submits another enrollment
  Then the workflow responds with 409 and error "DUPLICATE_ACTIVE_REQUEST"
 Scenario: B-AC6 Duplicate approved
  Given an enrollment in status "approved"
  When the same learner submits another enrollment
  Then the workflow responds with 409 and error "DUPLICATE_ACTIVE_REQUEST"
 Scenario: B-AC7 Retrieve with audit
  Given an enrollment in status "pending"
  When the enrollment is retrieved
  Then the retrieved enrollment retains its history
 Scenario: B-AC8 Filter status
  Given an enrollment in status "pending"
  When enrollments are filtered by "status"
  Then the filtered enrollments match "status"
 Scenario: B-AC8 Filter courseId
  Given an enrollment in status "pending"
  When enrollments are filtered by "courseId"
  Then the filtered enrollments match "courseId"
 Scenario: B-AC8 Filter learnerEmail
  Given an enrollment in status "pending"
  When enrollments are filtered by "learnerEmail"
  Then the filtered enrollments match "learnerEmail"
 Scenario: B-AC8 Filter combined
  Given an enrollment in status "pending"
  When enrollments are filtered by "combined"
  Then the filtered enrollments match "combined"
 Scenario: B-AC9 B-AC12 pending to approved
  Given an enrollment in status "pending"
  When the enrollment status becomes "approved" with reason "Prerequisite missing"
  Then the enrollment has status "approved" and 2 audit entries
 Scenario: B-AC9 B-AC12 pending to rejected
  Given an enrollment in status "pending"
  When the enrollment status becomes "rejected" with reason "Prerequisite missing"
  Then the enrollment has status "rejected" and 2 audit entries
 Scenario: B-AC9 B-AC12 pending to cancelled
  Given an enrollment in status "pending"
  When the enrollment status becomes "cancelled" with reason "Prerequisite missing"
  Then the enrollment has status "cancelled" and 2 audit entries
 Scenario: B-AC9 B-AC12 approved to cancelled
  Given an enrollment in status "approved"
  When the enrollment status becomes "cancelled" with reason "Prerequisite missing"
  Then the enrollment has status "cancelled" and 3 audit entries
 Scenario: B-AC10 Forbidden pending to pending
  Given an enrollment in status "pending"
  When the enrollment status becomes "pending" with reason "Reason"
  Then the workflow responds with 409 and error "INVALID_STATUS_TRANSITION"
 Scenario: B-AC10 Forbidden approved to rejected
  Given an enrollment in status "approved"
  When the enrollment status becomes "rejected" with reason "Reason"
  Then the workflow responds with 409 and error "INVALID_STATUS_TRANSITION"
 Scenario: B-AC10 Forbidden rejected to approved
  Given an enrollment in status "rejected"
  When the enrollment status becomes "approved" with reason "Reason"
  Then the workflow responds with 409 and error "INVALID_STATUS_TRANSITION"
 Scenario: B-AC10 Forbidden cancelled to approved
  Given an enrollment in status "cancelled"
  When the enrollment status becomes "approved" with reason "Reason"
  Then the workflow responds with 409 and error "INVALID_STATUS_TRANSITION"
 Scenario: B-AC11 Missing rejection reason
  Given an enrollment in status "pending"
  When the enrollment status becomes "rejected" with reason " "
  Then the workflow responds with 400 and error "INVALID_REQUEST"
 Scenario: B-AC12 Initial audit trail
  When a valid enrollment is submitted
  Then the enrollment is pending with 1 creation history entries
 Scenario: B-AC14 Missing request lookup
  When a missing enrollment is retrieved
  Then the workflow responds with 404 and error "ENROLLMENT_REQUEST_NOT_FOUND"
 Scenario: B-AC14 Missing request update
  When a missing enrollment is updated
  Then the workflow responds with 404 and error "ENROLLMENT_REQUEST_NOT_FOUND"
 Scenario: B-AC14 Invalid status
  Given an enrollment in status "pending"
  When the enrollment status becomes "invalid" with reason "Reason"
  Then the workflow responds with 400 and error "INVALID_REQUEST"
 Scenario: B-AC14 New request after rejected
  Given an enrollment in status "rejected"
  When a valid enrollment is submitted
  Then the enrollment is pending with 1 creation history entries
 Scenario: B-AC14 New request after cancelled
  Given an enrollment in status "cancelled"
  When a valid enrollment is submitted
  Then the enrollment is pending with 1 creation history entries
