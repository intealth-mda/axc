Feature: Course catalog search

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with ""
    Then the response status is 200
    And the total is at least 12
    When the client searches courses with "modality=online"
    Then the total is at least 1
    When the client searches courses with "modality=hybrid&status=draft"
    Then the total is at least 1
    When the client searches courses with "modality=in-person&status=retired"
    Then the total is at least 1

  Scenario: A-AC1 default list is paginated with page 1 and pageSize 10
    When the client searches courses with ""
    Then the response status is 200
    And the page is 1 with page size 10
    And the item count is 10

  Scenario: A-AC2 keyword search matches title, summary or tags case-insensitively
    When the client searches courses with "q=SECURITY"
    Then the response status is 200
    And the course ids are "course-001,course-005,course-010,course-004,course-012"

  Scenario: A-AC3 A-AC4 A-AC5 filters and combined filters
    When the client searches courses with "modality=online"
    Then every course has modality "online"
    When the client searches courses with "status=active"
    Then every course has status "active"
    When the client searches courses with "tag=AI"
    Then the course ids are "course-001,course-008,course-003"
    When the client searches courses with "q=security&modality=online&status=active"
    Then the course ids are "course-001"

  Scenario: A-AC6 pagination limits items and reports metadata
    When the client searches courses with "page=3&pageSize=5"
    Then the page is 3 with page size 5
    And the item count is 2
    And the total is at least 12
    And total pages is 3

  Scenario: A-AC7 sort by createdAt
    When the client searches courses with "sort=createdAt&pageSize=3"
    Then the course ids are "course-011,course-005,course-007"

  Scenario Outline: A-AC8 invalid query parameters return 400
    When the client searches courses with "<query>"
    Then the response status is 400
    And the error code is "INVALID_QUERY_PARAMETER"
    And the error names field "<field>"

    Examples:
      | query        | field    |
      | modality=tv  | modality |
      | status=done  | status   |
      | page=0       | page     |
      | page=abc     | page     |
      | pageSize=51  | pageSize |
      | sort=price   | sort     |

  Scenario: A-AC9 no matches return 200 with empty items
    When the client searches courses with "q=quantum-basket-weaving"
    Then the response status is 200
    And the item count is 0
    And total pages is 0
