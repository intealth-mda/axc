Feature: Course catalog search

  # ac-meta: A-AC10
  # ac-meta: A-AC11
  # ac-meta: A-AC12

  Scenario: A-AC1 GET /api/courses returns the default page
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog total items are 14
    And the course catalog total pages are 2
    And the course catalog item count is 10
    And the course catalog item ids are "course-001,course-010,course-004,course-007,course-003,course-011,course-006,course-009,course-012,course-002"

  Scenario: A-AC2 keyword search matches title, summary, and tags regardless of case
    When the client requests the course catalog with query "q=SeCuRiTy"
    Then the course catalog responds with status 200
    And the course catalog item ids are "course-001,course-009,course-002,course-008,course-013"
    And every course matches "security"

  Scenario: A-AC3 modality filter returns only online courses
    When the client requests the course catalog with query "modality=online"
    Then the course catalog responds with status 200
    And every course modality is "online"
    And the course catalog item ids are "course-001,course-004,course-012,course-008,course-005"

  Scenario: A-AC4 status filter returns only active courses
    When the client requests the course catalog with query "status=active"
    Then the course catalog responds with status 200
    And every course status is "active"
    And the course catalog total items are 7

  Scenario: A-AC5 tag filter matches a tag regardless of case
    When the client requests the course catalog with query "tag=AI"
    Then the course catalog responds with status 200
    And every course has tag "ai"
    And the course catalog item ids are "course-001,course-004,course-007"

  Scenario: A-AC6 page and pageSize limit the page
    When the client requests the course catalog with query "page=1&pageSize=5"
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 5
    And the course catalog item count is 5
    And the course catalog total items are 14
    And the course catalog total pages are 3

  Scenario: A-AC7 sort=createdAt orders courses by createdAt
    When the client requests the course catalog with query "sort=createdAt"
    Then the course catalog responds with status 200
    And the courses are sorted by "createdAt"
    And the first course id is "course-005"

  Scenario: A-AC8 invalid query parameters return HTTP 400
    When the client requests the course catalog with query "modality=remote"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error includes field "modality"
    When the client requests the course catalog with query "status=published"
    Then the course catalog responds with status 400
    And the course catalog error includes field "status"
    When the client requests the course catalog with query "page=0"
    Then the course catalog responds with status 400
    And the course catalog error includes field "page"
    When the client requests the course catalog with query "pageSize=51"
    Then the course catalog responds with status 400
    And the course catalog error includes field "pageSize"
    And the course catalog error message for "pageSize" is "pageSize must be between 1 and 50."
    When the client requests the course catalog with query "sort=rank"
    Then the course catalog responds with status 400
    And the course catalog error includes field "sort"

  Scenario: A-AC9 no matching courses return an empty page
    When the client requests the course catalog with query "q=zzzz-no-course"
    Then the course catalog responds with status 200
    And the course catalog item count is 0
    And the course catalog total items are 0
    And the course catalog total pages are 0
    And the course catalog page is 1
    And the course catalog page size is 10
