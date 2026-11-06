Feature: Course catalog search

  Scenario: A-AC1 default list is paginated
    When the client requests "/api/courses"
    Then the courses response status is 200
    And the courses page is 1 with page size 10 and 12 total items
    And there are 10 course items

  Scenario: A-AC2 keyword search is case-insensitive across title, summary and tags
    When the client requests "/api/courses?q=SeCuRiTy"
    Then the courses response status is 200
    And every course mentions "security"
    And there are 5 course items

  Scenario: A-AC3 modality filter returns only online courses
    When the client requests "/api/courses?modality=online"
    Then every course has modality "online"
    And there are 6 course items

  Scenario: A-AC4 status filter returns only active courses
    When the client requests "/api/courses?status=active"
    Then every course has status "active"
    And there are 7 course items

  Scenario: A-AC5 tag filter is case-insensitive
    When the client requests "/api/courses?tag=AI"
    Then every course has tag "ai"
    And there are 3 course items

  Scenario: A-AC6 pagination limits items and reports metadata
    When the client requests "/api/courses?page=3&pageSize=5"
    Then the courses page is 3 with page size 5 and 12 total items
    And there are 2 course items
    And total pages is 3

  Scenario: A-AC7 sort by createdAt
    When the client requests "/api/courses?sort=createdAt&pageSize=50"
    Then the courses are sorted by "createdAt"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client requests "/api/courses?<query>"
    Then the courses response status is 400
    And the error code is "INVALID_QUERY_PARAMETER" for field "<field>"

    Examples:
      | query        | field    |
      | modality=tv  | modality |
      | status=gone  | status   |
      | page=0       | page     |
      | pageSize=51  | pageSize |
      | sort=id      | sort     |

  Scenario: A-AC9 no matches return an empty list
    When the client requests "/api/courses?q=zzz-nothing"
    Then the courses response status is 200
    And there are 0 course items
    And the courses page is 1 with page size 10 and 0 total items

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests "/health"
    Then the courses response status is 200

  Scenario: A-AC11 combined filters q, modality and status
    When the client requests "/api/courses?q=security&modality=online&status=active&tag=ai&pageSize=5&sort=title"
    Then every course has modality "online"
    And every course has status "active"
    And there are 1 course items

  Scenario: A-AC12 documentation covers path, parameters, success and error
    Then the courses documentation mentions "GET /api/courses", "pageSize", "totalPages", "INVALID_QUERY_PARAMETER"
