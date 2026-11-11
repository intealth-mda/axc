Feature: Course catalog search

  Scenario: A-AC1 default listing is paginated
    When the client searches the course catalog with ""
    Then the response status is 200
    And the page is 1 with page size 10
    And the result has 10 items of 12 total

  Scenario: A-AC2 keyword search ignores case across title, summary and tags
    When the client searches the course catalog with "q=SeCuRiTy"
    Then the result ids are "course-002,course-001,course-012,course-007"

  Scenario: A-AC3 modality filter returns only online courses
    When the client searches the course catalog with "modality=online"
    Then every item has modality "online"
    And the result has 5 items of 5 total

  Scenario: A-AC4 status filter returns only active courses
    When the client searches the course catalog with "status=active"
    Then every item has status "active"

  Scenario: A-AC5 tag filter matches tags case-insensitively
    When the client searches the course catalog with "tag=ai"
    Then the result ids are "course-001,course-005,course-010"

  Scenario: A-AC6 page size limits items and returns metadata
    When the client searches the course catalog with "page=3&pageSize=5"
    Then the page is 3 with page size 5
    And the result has 2 items of 12 total
    And there are 3 total pages

  Scenario: A-AC7 sort by createdAt
    When the client searches the course catalog with "sort=createdAt&pageSize=3"
    Then the result ids are "course-012,course-005,course-010"

  Scenario Outline: A-AC8 invalid <field> returns 400
    When the client searches the course catalog with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | field    | query          |
      | modality | modality=remote |
      | status   | status=open    |
      | page     | page=0         |
      | pageSize | pageSize=51    |
      | sort     | sort=price     |

  Scenario: A-AC9 no matches return an empty page
    When the client searches the course catalog with "q=quantum&modality=online&status=active"
    Then the response status is 200
    And the result has 0 items of 0 total

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined filters narrow results
    When the client searches the course catalog with "q=security&modality=online&status=active&tag=ai"
    Then the result ids are "course-001"

  Scenario: A-AC12 documentation describes the endpoint
    Then the courses documentation mentions "GET /api/courses,pageSize,INVALID_QUERY_PARAMETER,totalPages,sort"
