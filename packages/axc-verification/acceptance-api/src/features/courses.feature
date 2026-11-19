Feature: Course catalog search

  Scenario: Default course list is paginated by title
    When the client requests courses at "/api/courses"
    Then the courses response status is 200
    And the courses page reports page 1, pageSize 10, totalItems 15, and totalPages 2
    And the courses page contains 10 items
    And the courses item ids start with "course-012"

  Scenario: Keyword search is case insensitive
    When the client requests courses at "/api/courses?q=SeCuRiTy&pageSize=50"
    Then the courses response status is 200
    And the courses item ids are "course-001,course-005,course-006,course-004"

  Scenario: Modality filter returns online courses
    When the client requests courses at "/api/courses?modality=online&pageSize=50"
    Then the courses response status is 200
    And the courses item ids are "course-001,course-007,course-005,course-010,course-014,course-015"

  Scenario: Status filter returns active courses
    When the client requests courses at "/api/courses?status=active&pageSize=50"
    Then the courses response status is 200
    And the courses item ids are "course-013,course-001,course-008,course-002,course-009,course-014,course-006"

  Scenario: Tag filter is case insensitive
    When the client requests courses at "/api/courses?tag=AI&pageSize=50"
    Then the courses response status is 200
    And the courses item ids are "course-001,course-008,course-009"

  Scenario: Keyword, modality, and status filters combine
    When the client requests courses at "/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title"
    Then the courses response status is 200
    And the courses item ids are "course-001"
    And the courses page reports page 1, pageSize 5, totalItems 1, and totalPages 1

  Scenario: Page size limits the page
    When the client requests courses at "/api/courses?page=2&pageSize=10"
    Then the courses response status is 200
    And the courses page contains 5 items
    And the courses item ids are "course-003,course-014,course-006,course-004,course-015"

  Scenario: Courses can be sorted by createdAt
    When the client requests courses at "/api/courses?sort=createdAt&pageSize=3"
    Then the courses response status is 200
    And the courses item ids are "course-004,course-001,course-007"

  Scenario: No matching courses return an empty page
    When the client requests courses at "/api/courses?q=zzznomatchxyz"
    Then the courses response status is 200
    And the courses page contains 0 items
    And the courses page reports page 1, pageSize 10, totalItems 0, and totalPages 0

  Scenario Outline: Invalid course queries are rejected
    When the client requests courses at "/api/courses?<query>"
    Then the courses response status is 400
    And the courses error code is "INVALID_QUERY_PARAMETER"
    And the courses error detail for "<field>" is "<message>"

    Examples:
      | query           | field    | message                                              |
      | modality=remote | modality | modality must be one of online, in-person, hybrid.  |
      | status=archived | status   | status must be one of draft, active, retired.       |
      | page=0          | page     | page must be an integer greater than or equal to 1. |
      | pageSize=51     | pageSize | pageSize must be between 1 and 50.                  |
      | sort=name       | sort     | sort must be one of title, createdAt, updatedAt.    |
