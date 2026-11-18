Feature: Course catalog search

  Scenario: A-AC1 default list is paginated with page 1 and pageSize 10
    When the client searches courses with ""
    Then the response status is 200
    And the pagination is page 1 size 10
    And the result has 10 items

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the total is at least 12
    And the results span modalities "hybrid,in-person,online" and statuses "active,draft,retired"

  Scenario: A-AC2 keyword search matches title, summary or tags regardless of case
    When the client searches courses with "q=SeCuRiTy"
    Then every result mentions "security"
    And the result ids include "course-001,course-002,course-004,course-011"

  Scenario Outline: A-AC3 A-AC4 A-AC5 filters return only matching courses
    When the client searches courses with "<query>"
    Then the response status is 200
    And every result has <field> "<value>"

    Examples:
      | query           | field    | value  |
      | modality=online | modality | online |
      | status=active   | status   | active |
      | tag=AI          | tag      | ai     |

  Scenario: A-AC5 tag filter returns courses containing the ai tag
    When the client searches courses with "tag=ai"
    Then the result ids include "course-001,course-003,course-006"

  Scenario: A-AC6 page size limits items and returns pagination metadata
    When the client searches courses with "page=2&pageSize=5"
    Then the pagination is page 2 size 5
    And the result has 5 items
    And the total pages match the total items for page size 5

  Scenario: A-AC7 sort by createdAt orders results ascending
    When the client searches courses with "sort=createdAt&pageSize=50"
    Then the results are ordered by "createdAt"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query        | field    |
      | modality=x   | modality |
      | status=gone  | status   |
      | page=0       | page     |
      | pageSize=51  | pageSize |
      | sort=price   | sort     |

  Scenario: A-AC9 no matching results return 200 with empty items
    When the client searches courses with "q=nonexistentxyz"
    Then the response status is 200
    And the result has 0 items
    And the pagination is page 1 size 10

  Scenario: A-AC10 existing healthcheck still answers
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined q, modality and status filters
    When the client searches courses with "q=security&modality=online&status=active"
    Then the result ids include "course-001"
    And every result has modality "online"
    And every result has status "active"

  Scenario: A-AC12 docs list path, parameters, success and error responses
    When the client reads the courses documentation
    Then the docs mention "GET /api/courses,pageSize,totalPages,INVALID_QUERY_PARAMETER"
