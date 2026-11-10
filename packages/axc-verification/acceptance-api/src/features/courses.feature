Feature: Course catalog search

  # ac-meta: A-AC10
  # ac-meta: A-AC11
  # ac-meta: A-AC12

  Scenario: A-AC1 GET /api/courses returns a paginated list using default pagination
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog item count is 10
    And the course catalog total items is 12
    And the course catalog total pages is 2
    And the first course id is "course-009"

  Scenario: A-AC2 GET /api/courses?q=security matches title, summary, or tags regardless of case
    When the client requests the course catalog with query "q=SeCuRiTy"
    Then the course catalog responds with status 200
    And every course matches keyword "security"
    And the course catalog total items is 4
    And the course catalog contains course "course-001"
    And the course catalog contains course "course-002"
    And the course catalog contains course "course-003"
    And the course catalog contains course "course-004"

  Scenario: A-AC3 GET /api/courses?modality=online returns only online courses
    When the client requests the course catalog with query "modality=online"
    Then the course catalog responds with status 200
    And every course has modality "online"
    And the course catalog total items is 5

  Scenario: A-AC4 GET /api/courses?status=active returns only active courses
    When the client requests the course catalog with query "status=active"
    Then the course catalog responds with status 200
    And every course has status "active"
    And the course catalog total items is 6

  Scenario: A-AC5 GET /api/courses?tag=ai returns courses that contain the tag
    When the client requests the course catalog with query "tag=AI"
    Then the course catalog responds with status 200
    And every course has tag "ai"
    And the course catalog total items is 2
    And the course catalog contains course "course-001"
    And the course catalog contains course "course-009"

  Scenario: A-AC6 GET /api/courses?page=1&pageSize=5 returns a five item page
    When the client requests the course catalog with query "page=1&pageSize=5"
    Then the course catalog responds with status 200
    And the course catalog item count is 5
    And the course catalog page is 1
    And the course catalog page size is 5
    And the course catalog total items is 12
    And the course catalog total pages is 3

  Scenario: A-AC7 GET /api/courses?sort=createdAt sorts by createdAt
    When the client requests the course catalog with query "sort=createdAt"
    Then the course catalog responds with status 200
    And the courses are sorted by createdAt
    And the first course id is "course-011"

  Scenario: A-AC8 invalid modality, status, page, pageSize, or sort returns HTTP 400
    When the client requests the course catalog with query "modality=remote&status=published&page=0&pageSize=51&sort=rank"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error message is "One or more query parameters are invalid."
    And the course catalog error fields are "modality,page,pageSize,sort,status"

  Scenario: A-AC9 no matching courses return an empty page
    When the client requests the course catalog with query "q=zzznomatch"
    Then the course catalog responds with status 200
    And the course catalog item count is 0
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog total items is 0
    And the course catalog total pages is 0
