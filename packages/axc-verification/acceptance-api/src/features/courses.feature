Feature: Course catalog search

  Scenario: A-AC1 GET /api/courses returns a paginated list using default pagination
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog total items is 12
    And the course catalog item count is 10

  Scenario: A-AC2 GET /api/courses?q=security matches title, summary, or tags
    When the client requests the course catalog with "q=security"
    Then the course catalog responds with status 200
    And the course catalog contains course "course-001"
    And the course catalog contains course "course-002"
    And the course catalog contains course "course-011"
    And the course catalog contains course "course-012"
    And the course catalog omits course "course-009"

  Scenario: A-AC3 GET /api/courses?modality=online returns only online courses
    When the client requests the course catalog with "modality=online"
    Then the course catalog responds with status 200
    And every course modality is "online"
    And the course catalog contains course "course-001"
    And the course catalog omits course "course-002"

  Scenario: A-AC4 GET /api/courses?status=active returns only active courses
    When the client requests the course catalog with "status=active"
    Then the course catalog responds with status 200
    And every course status is "active"
    And the course catalog contains course "course-001"
    And the course catalog omits course "course-004"

  Scenario: A-AC5 GET /api/courses?tag=ai returns courses containing the ai tag
    When the client requests the course catalog with "tag=ai"
    Then the course catalog responds with status 200
    And the course catalog contains course "course-001"
    And the course catalog contains course "course-007"
    And the course catalog omits course "course-002"
    And every course has tag "ai"

  Scenario: A-AC6 GET /api/courses?page=1&pageSize=5 limits the page
    When the client requests the course catalog with "page=1&pageSize=5"
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 5
    And the course catalog item count is 5
    And the course catalog total items is 12
    And the course catalog total pages is 3

  Scenario: A-AC7 GET /api/courses?sort=createdAt returns records sorted by createdAt
    When the client requests the course catalog with "sort=createdAt&pageSize=50"
    Then the course catalog responds with status 200
    And the courses are sorted by createdAt

  Scenario: A-AC8 invalid modality, status, page, pageSize, or sort returns HTTP 400
    When the client requests the course catalog with "modality=nope&status=nope&page=0&pageSize=51&sort=rank"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error fields are "modality,page,pageSize,sort,status"

  Scenario: A-AC9 no matching results return an empty items array
    When the client requests the course catalog with "q=zzzz-no-such-course"
    Then the course catalog responds with status 200
    And the course catalog item count is 0
    And the course catalog total items is 0
    And the course catalog total pages is 0

  # ac-meta: A-AC10
  # ac-meta: A-AC11
  # ac-meta: A-AC12
