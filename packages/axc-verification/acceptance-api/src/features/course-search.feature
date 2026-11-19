Feature: Course catalog search

  Scenario: A-AC1 default list is paginated
    When the client searches courses with ""
    Then the response status is 200
    And the page is 1 with page size 10
    And the result has 10 items

  Scenario: A-AC2 keyword search ignores case across title, summary and tags
    When the client searches courses with "q=SeCuRiTy"
    Then the result ids are "course-001,course-007,course-012"

  Scenario: A-AC3 modality filter returns only online courses
    When the client searches courses with "modality=online"
    Then every item has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client searches courses with "status=active"
    Then every item has status "active"

  Scenario: A-AC5 tag filter matches case-insensitively
    When the client searches courses with "tag=AI"
    Then the result ids are "course-001,course-009,course-003"

  Scenario: A-AC6 page size limits items and reports metadata
    When the client searches courses with "page=2&pageSize=5"
    Then the page is 2 with page size 5
    And the result has 5 items
    And the totals are 12 items over 3 pages

  Scenario: A-AC7 sort by createdAt
    When the client searches courses with "sort=createdAt&pageSize=3"
    Then the result ids are "course-001,course-002,course-003"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query       | field    |
      | modality=x  | modality |
      | status=x    | status   |
      | page=0      | page     |
      | pageSize=51 | pageSize |
      | sort=x      | sort     |

  Scenario: A-AC9 no match returns empty items
    When the client searches courses with "q=zzz-nothing"
    Then the response status is 200
    And the result has 0 items
    And the totals are 0 items over 0 pages

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined q, modality and status filter
    When the client searches courses with "q=security&modality=online&status=active"
    Then the result ids are "course-001,course-012"

  Scenario: A-AC12 seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the totals are 12 items over 1 pages
    And the result mixes 3 modalities and 3 statuses
