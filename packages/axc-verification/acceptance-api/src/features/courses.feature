Feature: Course catalog search

  Scenario: A-AC1 default list is paginated with page 1 and pageSize 10
    When the client requests "/api/courses"
    Then the response status is 200
    And the page is 1, pageSize is 10, totalItems is 12 and there are 10 items

  Scenario: A-AC2 q matches title, summary or tags regardless of case
    When the client requests "/api/courses?q=SeCuRiTy"
    Then the response status is 200
    And the item ids are "course-002,course-001,course-006,course-011"

  Scenario: A-AC3 modality filter returns only online courses
    When the client requests "/api/courses?modality=online&pageSize=50"
    Then every item has "modality" equal to "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client requests "/api/courses?status=active&pageSize=50"
    Then every item has "status" equal to "active"

  Scenario: A-AC5 tag filter matches case-insensitively
    When the client requests "/api/courses?tag=ai"
    Then the item ids are "course-001,course-009,course-004"

  Scenario: A-AC6 pagination returns no more than pageSize items with metadata
    When the client requests "/api/courses?page=3&pageSize=5"
    Then the page is 3, pageSize is 5, totalItems is 12 and there are 2 items

  Scenario: A-AC7 sort by createdAt
    When the client requests "/api/courses?sort=createdAt&pageSize=3"
    Then the item ids are "course-005,course-011,course-009"

  Scenario Outline: A-AC8 invalid <field> returns 400
    When the client requests "/api/courses?<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER" for field "<field>"

    Examples:
      | field    | query           |
      | modality | modality=remote |
      | status   | status=archived |
      | page     | page=0          |
      | pageSize | pageSize=51     |
      | sort     | sort=price      |

  Scenario: A-AC9 no match returns 200 with empty items
    When the client requests "/api/courses?q=zzz-nothing"
    Then the response status is 200
    And the page is 1, pageSize is 10, totalItems is 0 and there are 0 items

  Scenario: A-AC10 existing healthcheck still answers
    When the client requests "/health"
    Then the response status is 200

  Scenario: A-AC11 combined q, modality and status filters
    When the client requests "/api/courses?q=security&modality=online&status=active"
    Then the item ids are "course-001,course-006"

  Scenario: A-AC12 documentation lists endpoint, parameters and errors
    Then the courses doc mentions "GET /api/courses,q,modality,status,tag,page,pageSize,sort,totalPages,INVALID_QUERY_PARAMETER"
