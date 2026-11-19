Feature: Course catalog search

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the total course count is at least 12
    And the courses span 3 modalities and 3 statuses

  Scenario: A-AC1 default search returns the first page of 10
    When the client searches courses with ""
    Then the response status is 200
    And the page is 1 of size 10 with 10 items

  Scenario: A-AC2 keyword search matches title, summary or tags in any case
    When the client searches courses with "q=SECURITY"
    Then every course mentions "security"
    And the course ids include "course-003"

  Scenario: A-AC3 modality filter returns only online courses
    When the client searches courses with "modality=online"
    Then every course has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client searches courses with "status=active"
    Then every course has status "active"

  Scenario: A-AC5 tag filter matches tag in any case
    When the client searches courses with "tag=ai"
    Then the course ids include "course-004"
    And every course has tag "ai"

  Scenario: A-AC6 pagination limits items and reports metadata
    When the client searches courses with "page=2&pageSize=5"
    Then the page is 2 of size 5 with 5 items
    And the total is 12 courses over 3 pages

  Scenario: A-AC7 sort by createdAt orders ascending
    When the client searches courses with "sort=createdAt&pageSize=50"
    Then the courses are ordered by "createdAt"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query        | field    |
      | modality=vr  | modality |
      | status=live  | status   |
      | page=0       | page     |
      | pageSize=51  | pageSize |
      | sort=id      | sort     |

  Scenario: A-AC9 no match returns 200 with empty items
    When the client searches courses with "q=zzz-nothing"
    Then the response status is 200
    And the total is 0 courses over 0 pages

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined q, modality and status filters
    When the client searches courses with "q=security&modality=online&status=active"
    Then the course ids are "course-001"

  Scenario: A-AC12 docs describe path, parameters, success and error responses
    Then the courses doc mentions "GET /api/courses", "pageSize", "totalPages" and "INVALID_QUERY_PARAMETER"
