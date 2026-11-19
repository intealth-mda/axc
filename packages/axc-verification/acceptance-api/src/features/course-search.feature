Feature: Course search

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the response status is 200
    And the total is at least 12
    And the results include modalities "online,in-person,hybrid" and statuses "draft,active,retired"

  Scenario: A-AC1 default search returns the first page of 10
    When the client searches courses with ""
    Then the response status is 200
    And the page is 1 with page size 10
    And there are at most 10 items

  Scenario: A-AC2 keyword search matches title, summary or tags case-insensitively
    When the client searches courses with "q=SECURITY"
    Then every item mentions "security"

  Scenario: A-AC3 modality filter returns only online courses
    When the client searches courses with "modality=online"
    Then every item has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client searches courses with "status=active&modality=online&q=secure"
    Then every item has status "active"
    And every item has modality "online"

  Scenario: A-AC5 tag filter returns courses tagged ai
    When the client searches courses with "tag=AI"
    Then every item has tag "ai"

  Scenario: A-AC6 page size 5 limits items and returns metadata
    When the client searches courses with "page=1&pageSize=5"
    Then there are at most 5 items
    And the page is 1 with page size 5
    And the total pages is 3

  Scenario: A-AC7 sort by createdAt orders results
    When the client searches courses with "sort=createdAt"
    Then the first item is "course-001"

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
      | sort=id     | sort     |

  Scenario: A-AC9 no matches returns an empty list
    When the client searches courses with "q=zzzz"
    Then the response status is 200
    And there are at most 0 items

  Scenario: A-AC10 existing healthcheck still answers
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined q, modality and status filters work
    When the client searches courses with "q=security&modality=in-person&status=active"
    Then the first item is "course-008"

  Scenario: A-AC12 course docs describe path, parameters, responses and errors
    Then the docs page "courses" mentions "GET /api/courses,pageSize,totalPages,INVALID_QUERY_PARAMETER"

  Scenario: B-AC1 course search still works
    When the client searches courses with "status=active"
    Then the response status is 200
    And every item has status "active"
