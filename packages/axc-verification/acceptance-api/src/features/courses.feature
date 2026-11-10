Feature: Course catalog search

  # ac-meta: A-AC10
  # ac-meta: A-AC11
  # ac-meta: A-AC12

  Scenario: A-AC1 default pagination
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog pageSize is 10
    And the course catalog item count is 10
    And the course catalog totalItems is 13
    And the course catalog totalPages is 2
    And the first course id is "course-001"
    And the course catalog items are sorted by title

  Scenario: A-AC2 keyword search
    When the client requests the course catalog with "q=SeCuRiTy"
    Then the course catalog responds with status 200
    And the course catalog totalItems is 4
    And the course catalog item count is 4
    And every course matches keyword "security"
    And the course catalog includes "course-001"
    And the course catalog includes "course-006"
    And the course catalog includes "course-009"
    And the course catalog includes "course-012"

  Scenario: A-AC3 modality filter
    When the client requests the course catalog with "modality=online"
    Then the course catalog responds with status 200
    And the course catalog totalItems is 6
    And every course modality is "online"

  Scenario: A-AC4 status filter
    When the client requests the course catalog with "status=active"
    Then the course catalog responds with status 200
    And the course catalog totalItems is 7
    And every course status is "active"

  Scenario: A-AC5 tag filter
    When the client requests the course catalog with "tag=ai"
    Then the course catalog responds with status 200
    And the course catalog totalItems is 2
    And the course catalog includes "course-001"
    And the course catalog includes "course-011"
    And every course tag contains "ai"

  Scenario: A-AC6 pagination
    When the client requests the course catalog with "page=1&pageSize=5"
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog pageSize is 5
    And the course catalog item count is 5
    And the course catalog totalItems is 13
    And the course catalog totalPages is 3

  Scenario: A-AC7 createdAt sort
    When the client requests the course catalog with "sort=createdAt"
    Then the course catalog responds with status 200
    And the first course id is "course-002"
    And the course catalog items are sorted by createdAt

  Scenario: A-AC8 invalid query parameters
    When the client requests the course catalog with "modality=remote&status=archived&page=0&pageSize=51&sort=rank"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error message is "One or more query parameters are invalid."
    And the course catalog error fields are "modality,page,pageSize,sort,status"

  Scenario: A-AC9 no matching courses
    When the client requests the course catalog with "q=zzznomatch"
    Then the course catalog responds with status 200
    And the course catalog items are empty
    And the course catalog page is 1
    And the course catalog pageSize is 10
    And the course catalog totalItems is 0
    And the course catalog totalPages is 0

  Scenario: A2 combined keyword modality and status
    When the client requests the course catalog with "q=security&modality=online&status=active"
    Then the course catalog responds with status 200
    And the course catalog totalItems is 2
    And the course catalog includes "course-001"
    And the course catalog includes "course-009"
    And every course modality is "online"
    And every course status is "active"
    And every course matches keyword "security"
