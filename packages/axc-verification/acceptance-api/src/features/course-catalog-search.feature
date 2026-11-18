Feature: Course catalog search

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the response status is 200
    And the total is at least 12
    And the courses include every modality and status

  Scenario: A-AC1 default pagination
    When the client searches courses with ""
    Then the response status is 200
    And the page is 1 with page size 10
    And there are 10 courses

  Scenario: A-AC2 keyword search is case-insensitive across title, summary and tags
    When the client searches courses with "q=SeCuRiTy"
    Then the course ids are "course-001,course-009,course-005"

  Scenario: A-AC3 modality filter
    When the client searches courses with "modality=online"
    Then every course has modality "online"

  Scenario: A-AC4 status filter
    When the client searches courses with "status=active"
    Then every course has status "active"

  Scenario: A-AC5 tag filter is case-insensitive
    When the client searches courses with "tag=ai"
    Then the course ids are "course-001,course-010,course-004"

  Scenario: A-AC6 pagination limits items and reports metadata
    When the client searches courses with "page=2&pageSize=5"
    Then the page is 2 with page size 5
    And there are 5 courses
    And the total is 12 over 3 pages

  Scenario: A-AC7 sort by createdAt
    When the client searches courses with "sort=createdAt&pageSize=3"
    Then the course ids are "course-008,course-012,course-005"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query        | field    |
      | modality=x   | modality |
      | status=x     | status   |
      | page=0       | page     |
      | pageSize=51  | pageSize |
      | sort=price   | sort     |

  Scenario: A-AC9 no matches return an empty list
    When the client searches courses with "q=zzzz"
    Then the response status is 200
    And there are 0 courses
    And the total is 0 over 0 pages

  Scenario: A-AC10 existing healthcheck still answers
    When the client requests the healthcheck
    Then the response status is 200

  Scenario: A-AC11 combined keyword, modality and status filters
    When the client searches courses with "q=security&modality=online&status=active"
    Then the course ids are "course-001,course-009"

  Scenario: A-AC12 docs describe path, parameters, success and error
    When the client reads the courses documentation
    Then the docs mention "GET /api/courses"
    And the docs mention "pageSize"
    And the docs mention "totalPages"
    And the docs mention "INVALID_QUERY_PARAMETER"
