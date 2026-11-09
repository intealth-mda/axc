Feature: Course catalog search

  Scenario: A-AC1 default list is paginated
    When the client requests "/api/courses"
    Then the response status is 200
    And the response has page 1, pageSize 10 and at most 10 items

  Scenario: A-AC2 keyword search is case-insensitive across title, summary and tags
    When the client requests "/api/courses?q=SeCuRiTy"
    Then the response status is 200
    And the item ids are "course-001,course-005,course-012,course-003"

  Scenario: A-AC3 modality filter returns only online courses
    When the client requests "/api/courses?modality=online&pageSize=50"
    Then every item has "modality" equal to "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client requests "/api/courses?status=active&pageSize=50"
    Then every item has "status" equal to "active"

  Scenario: A-AC5 tag filter matches case-insensitively
    When the client requests "/api/courses?tag=ai"
    Then the item ids are "course-001,course-006,course-002"

  Scenario: A-AC6 page size limits items and returns metadata
    When the client requests "/api/courses?page=2&pageSize=5"
    Then the response has page 2, pageSize 5 and at most 5 items
    And the response reports 13 total items over 3 pages

  Scenario: A-AC7 sort by createdAt
    When the client requests "/api/courses?sort=createdAt&pageSize=3"
    Then the item ids are "course-007,course-011,course-010"

  Scenario Outline: A-AC8 invalid <field> returns 400
    When the client requests "/api/courses?<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER" for field "<field>"

    Examples:
      | field    | query          |
      | modality | modality=space |
      | status   | status=gone    |
      | page     | page=0         |
      | pageSize | pageSize=51    |
      | sort     | sort=id        |

  Scenario: A-AC9 no match returns 200 with empty items
    When the client requests "/api/courses?q=zzzz"
    Then the response status is 200
    And the item ids are ""
    And the response reports 0 total items over 0 pages

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests "/health"
    Then the response status is 200

  Scenario: A-AC11 combined filters q, modality and status
    When the client requests "/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title"
    Then the item ids are "course-001"

  Scenario: A-AC12 docs page covers endpoint, parameters and responses
    Then the courses doc mentions "GET /api/courses,q,modality,status,tag,page,pageSize,sort,totalPages,INVALID_QUERY_PARAMETER"
