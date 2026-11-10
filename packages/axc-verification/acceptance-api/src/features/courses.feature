Feature: Course catalog search

  # ac-meta: A-AC10
  # ac-meta: A-AC12

  Scenario: A-AC1
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog total items is 12
    And the course catalog total pages is 2
    And the course catalog item count is 10

  Scenario: A-AC2
    When the client requests the course catalog with query "q=SeCuRiTy"
    Then the course catalog responds with status 200
    And the course catalog total items is 3
    And every course catalog item matches keyword "security"

  Scenario: A-AC3
    When the client requests the course catalog with query "modality=online"
    Then the course catalog responds with status 200
    And the course catalog total items is 5
    And every course catalog item has modality "online"

  Scenario: A-AC4
    When the client requests the course catalog with query "status=active"
    Then the course catalog responds with status 200
    And the course catalog total items is 6
    And every course catalog item has status "active"

  Scenario: A-AC5
    When the client requests the course catalog with query "tag=AI"
    Then the course catalog responds with status 200
    And the course catalog total items is 2
    And every course catalog item has tag "ai"

  Scenario: A-AC6
    When the client requests the course catalog with query "page=1&pageSize=5"
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 5
    And the course catalog total items is 12
    And the course catalog total pages is 3
    And the course catalog item count is 5

  Scenario: A-AC7
    When the client requests the course catalog with query "sort=createdAt&pageSize=50"
    Then the course catalog responds with status 200
    And the course catalog items are sorted by createdAt
    And the course catalog first item id is "course-008"

  Scenario: A-AC8
    When the client requests the course catalog with query "modality=remote&status=paused&page=0&pageSize=51&sort=rating"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"
    And the course catalog error message is "One or more query parameters are invalid."
    And the course catalog error fields are "modality,status,page,pageSize,sort"

  Scenario: A-AC9
    When the client requests the course catalog with query "q=zzzz-no-such-course"
    Then the course catalog responds with status 200
    And the course catalog item count is 0
    And the course catalog total items is 0
    And the course catalog total pages is 0
    And the course catalog page is 1
    And the course catalog page size is 10

  Scenario: A-AC11
    When the client requests the course catalog with query "q=security&modality=online&status=active"
    Then the course catalog responds with status 200
    And the course catalog total items is 1
    And the course catalog first item id is "course-001"
    When the client requests the course catalog with query "tag=leadership&modality=hybrid&status=active"
    Then the course catalog responds with status 200
    And the course catalog total items is 1
    And the course catalog first item id is "course-010"
