Feature: Course catalog search

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with ""
    Then the response status is 200
    And the total is at least 12
    And the courses span 3 modalities and 3 statuses

  Scenario: A-AC1 default list is paginated with page 1 and size 10
    When the client searches courses with ""
    Then the response status is 200
    And the page is 1 with size 10 and 10 items

  Scenario: A-AC2 keyword search matches title, summary or tags in any case
    When the client searches courses with "q=SeCuRiTy"
    Then every course mentions "security"
    And the course ids include "course-004"

  Scenario: A-AC3 modality filter returns only online courses
    When the client searches courses with "modality=online"
    Then every course has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client searches courses with "status=active"
    Then every course has status "active"

  Scenario: A-AC5 tag filter returns courses tagged ai in any case
    When the client searches courses with "tag=ai"
    Then the course ids include "course-003"
    And every course has tag "ai"

  Scenario: A-AC6 page size limits items and returns metadata
    When the client searches courses with "page=2&pageSize=5"
    Then the page is 2 with size 5 and 5 items
    And the total is 12 over 3 pages

  Scenario: A-AC7 sort by createdAt
    When the client searches courses with "sort=createdAt&pageSize=50"
    Then the courses are ordered by "createdAt"

  Scenario Outline: A-AC8 invalid <field> returns 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | field    | query        |
      | modality | modality=tv  |
      | status   | status=gone  |
      | page     | page=0       |
      | pageSize | pageSize=51  |
      | sort     | sort=price   |

  Scenario: A-AC9 no match returns 200 with empty items
    When the client searches courses with "q=zzzz"
    Then the response status is 200
    And the page is 1 with size 10 and 0 items
    And the total is 0 over 0 pages

  Scenario: A-AC10 existing healthcheck still answers
    When the client checks course service health
    Then the response status is 200

  Scenario: A-AC11 combined q, modality and status filters
    When the client searches courses with "q=security&modality=online&status=active"
    Then the course ids are "course-001"

  Scenario: A-AC12 docs list endpoint, parameters, success and error response
    Then the courses doc covers "GET /api/courses, pageSize, totalPages, INVALID_QUERY_PARAMETER"
