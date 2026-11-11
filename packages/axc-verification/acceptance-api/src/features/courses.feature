Feature: Course catalog search

  Scenario: A-AC1 the catalog lists courses with default pagination
    When the client searches the catalog with ""
    Then the response status is 200
    And the pagination is page 1 of size 10 with 12 total courses
    And the page holds at most 10 courses

  Scenario: A-AC2 keyword search matches title, summary or tags regardless of case
    When the client searches the catalog with "?q=SeCuRiTy"
    Then every returned course mentions "security"

  Scenario: A-AC3 modality filter returns only online courses
    When the client searches the catalog with "?modality=online"
    Then every returned course has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client searches the catalog with "?status=active"
    Then every returned course has status "active"

  Scenario: A-AC5 tag filter returns courses tagged ai
    When the client searches the catalog with "?tag=AI"
    Then every returned course has tag "ai"

  Scenario: A-AC6 page size limits the page and reports metadata
    When the client searches the catalog with "?page=2&pageSize=5"
    Then the page holds at most 5 courses
    And the pagination is page 2 of size 5 with 12 total courses

  Scenario: A-AC7 courses are sorted by createdAt
    When the client searches the catalog with "?sort=createdAt"
    Then the courses are ordered by "createdAt"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client searches the catalog with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query           | field    |
      | ?modality=remote | modality |
      | ?status=gone    | status   |
      | ?page=0         | page     |
      | ?pageSize=51    | pageSize |
      | ?sort=price     | sort     |

  Scenario: A-AC9 no matches return an empty list
    When the client searches the catalog with "?q=zzz-nothing"
    Then the response status is 200
    And the pagination is page 1 of size 10 with 0 total courses
    And the page holds at most 0 courses

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined keyword, modality and status filters
    When the client searches the catalog with "?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title"
    Then every returned course has modality "online"
    And every returned course has status "active"
    And every returned course mentions "security"

  Scenario: A-AC12 documentation covers endpoint, parameters and responses
    Then the courses documentation mentions each of:
      | GET /api/courses        |
      | pageSize                |
      | totalPages              |
      | INVALID_QUERY_PARAMETER |
