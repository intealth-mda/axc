Feature: Course catalog search

  # ac-meta: A-AC10
  # ac-meta: A-AC11
  # ac-meta: A-AC12

  Scenario: A-AC1 GET /api/courses returns the default page
    When the client requests the course catalog
    Then the courses response status is 200
    And the courses page is 1
    And the courses page size is 10
    And the courses total items is 12
    And the courses total pages is 2
    And the courses item count is 10
    And the courses item ids are "course-001,course-008,course-011,course-007,course-009,course-012,course-004,course-003,course-006,course-010"
    And the courses are sorted by "title"

  Scenario: A-AC2 keyword search matches title, summary, and tags regardless of case
    When the client requests the course catalog with query "q=SeCuRiTy"
    Then the courses response status is 200
    And the courses item ids are "course-001,course-011,course-012,course-004,course-006"

  Scenario: keyword search matches a summary without a title or tag hit
    When the client requests the course catalog with query "q=obligations"
    Then the courses response status is 200
    And the courses item ids are "course-004"

  Scenario: keyword search matches a tag without a title or summary hit
    When the client requests the course catalog with query "q=OPERATIONS"
    Then the courses response status is 200
    And the courses item ids are "course-006"

  Scenario: A-AC3 modality filter returns online courses
    When the client requests the course catalog with query "modality=online"
    Then the courses response status is 200
    And every course modality is "online"
    And the courses total items is 5
    And the courses item ids are "course-001,course-008,course-012,course-004,course-005"

  Scenario: modality boundary in-person is accepted
    When the client requests the course catalog with query "modality=in-person"
    Then the courses response status is 200
    And every course modality is "in-person"
    And the courses item ids are "course-009,course-006,course-002"

  Scenario: modality hybrid is accepted
    When the client requests the course catalog with query "modality=hybrid"
    Then the courses response status is 200
    And every course modality is "hybrid"
    And the courses total items is 4

  Scenario: invalid modality is rejected
    When the client requests the course catalog with query "modality=classroom"
    Then the courses response status is 400
    And the courses error code is "INVALID_QUERY_PARAMETER"
    And the courses error fields are "modality"
    And the courses error detail for "modality" is "modality must be one of online, in-person, hybrid."

  Scenario: A-AC4 status filter returns active courses
    When the client requests the course catalog with query "status=active"
    Then the courses response status is 200
    And every course status is "active"
    And the courses total items is 6
    And the courses item ids are "course-001,course-011,course-007,course-012,course-005,course-002"

  Scenario: status boundary retired is accepted
    When the client requests the course catalog with query "status=retired"
    Then the courses response status is 200
    And every course status is "retired"
    And the courses item ids are "course-009,course-004,course-010"

  Scenario: status draft is accepted
    When the client requests the course catalog with query "status=draft"
    Then the courses response status is 200
    And every course status is "draft"
    And the courses total items is 3

  Scenario: invalid status is rejected
    When the client requests the course catalog with query "status=published"
    Then the courses response status is 400
    And the courses error fields are "status"
    And the courses error detail for "status" is "status must be one of draft, active, retired."

  Scenario: A-AC5 tag filter returns courses with the ai tag
    When the client requests the course catalog with query "tag=AI"
    Then the courses response status is 200
    And every course includes tag "ai"
    And the courses item ids are "course-001,course-010,course-005"

  Scenario: A-AC6 pagination limits the page
    When the client requests the course catalog with query "page=1&pageSize=5"
    Then the courses response status is 200
    And the courses page is 1
    And the courses page size is 5
    And the courses item count is 5
    And the courses total items is 12
    And the courses total pages is 3
    And the courses item ids are "course-001,course-008,course-011,course-007,course-009"

  Scenario: page 2 returns the next title-sorted slice
    When the client requests the course catalog with query "page=2&pageSize=5"
    Then the courses response status is 200
    And the courses page is 2
    And the courses page size is 5
    And the courses item count is 5
    And the courses total items is 12
    And the courses total pages is 3
    And the courses item ids are "course-012,course-004,course-003,course-006,course-010"

  Scenario: page boundary 1 is accepted
    When the client requests the course catalog with query "page=1"
    Then the courses response status is 200
    And the courses page is 1

  Scenario: page below 1 is rejected
    When the client requests the course catalog with query "page=0"
    Then the courses response status is 400
    And the courses error fields are "page"
    And the courses error detail for "page" is "page must be an integer greater than or equal to 1."

  Scenario: non-integer page is rejected
    When the client requests the course catalog with query "page=1.5"
    Then the courses response status is 400
    And the courses error fields are "page"

  Scenario: pageSize boundary 1 is accepted
    When the client requests the course catalog with query "pageSize=1"
    Then the courses response status is 200
    And the courses page size is 1
    And the courses item count is 1
    And the courses total items is 12
    And the courses total pages is 12
    And the courses item ids are "course-001"

  Scenario: pageSize boundary 50 is accepted
    When the client requests the course catalog with query "pageSize=50"
    Then the courses response status is 200
    And the courses page size is 50
    And the courses item count is 12
    And the courses total items is 12
    And the courses total pages is 1

  Scenario: pageSize below 1 is rejected
    When the client requests the course catalog with query "pageSize=0"
    Then the courses response status is 400
    And the courses error fields are "pageSize"
    And the courses error detail for "pageSize" is "pageSize must be between 1 and 50."

  Scenario: pageSize above 50 is rejected
    When the client requests the course catalog with query "pageSize=51"
    Then the courses response status is 400
    And the courses error fields are "pageSize"
    And the courses error detail for "pageSize" is "pageSize must be between 1 and 50."

  Scenario: A-AC7 sort by createdAt orders the catalog
    When the client requests the course catalog with query "sort=createdAt&pageSize=50"
    Then the courses response status is 200
    And the courses are sorted by "createdAt"
    And the courses item ids are "course-009,course-004,course-010,course-001,course-006,course-002,course-003,course-005,course-007,course-008,course-011,course-012"

  Scenario: sort boundary updatedAt is accepted
    When the client requests the course catalog with query "sort=updatedAt&pageSize=50"
    Then the courses response status is 200
    And the courses are sorted by "updatedAt"
    And the courses item ids are "course-009,course-006,course-004,course-003,course-002,course-001,course-008,course-005,course-011,course-007,course-012,course-010"

  Scenario: sort boundary title is accepted
    When the client requests the course catalog with query "sort=title&pageSize=10"
    Then the courses response status is 200
    And the courses are sorted by "title"
    And the courses item ids are "course-001,course-008,course-011,course-007,course-009,course-012,course-004,course-003,course-006,course-010"

  Scenario: invalid sort is rejected
    When the client requests the course catalog with query "sort=popularity"
    Then the courses response status is 400
    And the courses error fields are "sort"
    And the courses error detail for "sort" is "sort must be one of title, createdAt, updatedAt."

  Scenario: A-AC8 invalid modality, status, page, pageSize, and sort return HTTP 400
    When the client requests the course catalog with query "modality=classroom&status=published&page=0&pageSize=51&sort=popularity"
    Then the courses response status is 400
    And the courses error code is "INVALID_QUERY_PARAMETER"
    And the courses error message is "One or more query parameters are invalid."
    And the courses error fields are "modality,status,page,pageSize,sort"
    And the courses error detail for "pageSize" is "pageSize must be between 1 and 50."

  Scenario: combined keyword, modality, and status filters
    When the client requests the course catalog with query "q=security&modality=online&status=active"
    Then the courses response status is 200
    And the courses item ids are "course-001,course-012"
    And every course modality is "online"
    And every course status is "active"

  Scenario: A-AC9 no matches return an empty page
    When the client requests the course catalog with query "q=zzzz-no-such-course"
    Then the courses response status is 200
    And the courses item count is 0
    And the courses total items is 0
    And the courses page is 1
    And the courses page size is 10
    And the courses total pages is 0
