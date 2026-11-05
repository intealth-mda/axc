Feature: Courses catalog search

  Scenario: A-AC1 default list is paginated
    When the client requests "/api/courses"
    Then the courses response status is 200
    And the courses page is 1 with page size 10
    And the courses response has 10 items

  Scenario: A-AC2 keyword search is case-insensitive across title, summary and tags
    When the client requests "/api/courses?q=SeCuRiTy"
    Then the courses response status is 200
    And every course mentions "security"
    And the courses total is 4

  Scenario: A-AC3 modality filter returns only online courses
    When the client requests "/api/courses?modality=online"
    Then every course has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client requests "/api/courses?status=active"
    Then every course has status "active"

  Scenario: A-AC5 tag filter matches case-insensitively
    When the client requests "/api/courses?tag=ai"
    Then every course has tag "ai"
    And the courses total is 4

  Scenario: A-AC6 page size limits items and returns metadata
    When the client requests "/api/courses?page=2&pageSize=5"
    Then the courses page is 2 with page size 5
    And the courses response has 5 items
    And the courses total is 12

  Scenario: A-AC7 sort by createdAt
    When the client requests "/api/courses?sort=createdAt"
    Then the courses are sorted by "createdAt"

  Scenario Outline: A-AC8 invalid <field> returns 400
    When the client requests "/api/courses?<field>=<value>"
    Then the courses response status is 400
    And the error names field "<field>"

    Examples:
      | field    | value  |
      | modality | remote |
      | status   | live   |
      | page     | 0      |
      | pageSize | 51     |
      | sort     | name   |

  Scenario: A-AC9 no matches returns empty items
    When the client requests "/api/courses?q=zzzz-nothing"
    Then the courses response status is 200
    And the courses response has 0 items
    And the courses total is 0

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined filters q, modality and status
    When the client requests "/api/courses?q=security&modality=online&status=active"
    Then every course has modality "online"
    And every course has status "active"
    And the courses total is 1

  Scenario: A-AC12 documentation covers the endpoint
    Then the courses doc mentions "GET /api/courses, q, modality, status, tag, page, pageSize, sort, totalPages, INVALID_QUERY_PARAMETER"
