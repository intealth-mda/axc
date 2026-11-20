Feature: Course search

  Scenario: seed has 12+ courses of mixed modality, status and tags
    When the client searches courses with "pageSize=50"
    Then the catalog holds at least 12 courses mixing modalities, statuses and tags

  Scenario: B-AC1 A-AC1 course search still returns a default page
    When the client searches courses with ""
    Then the response status is 200
    And the page metadata is page 1 size 10
    And no more than 10 courses are returned

  Scenario: A-AC2 keyword search matches title, summary or tags regardless of case
    When the client searches courses with "q=SECURITY"
    Then every returned course matches keyword "security"

  Scenario Outline: A-AC3 A-AC4 A-AC5 filters return only matching courses
    When the client searches courses with "<query>"
    Then every returned course has <field> "<value>"

    Examples:
      | query                                 | field    | value  |
      | modality=online                       | modality | online |
      | status=active                         | status   | active |
      | tag=AI                                | tag      | ai     |
      | q=security&modality=online&status=active | modality | online |
      | q=security&modality=online&status=active | status   | active |

  Scenario: A-AC6 page size limits items and reports metadata
    When the client searches courses with "page=1&pageSize=5"
    Then no more than 5 courses are returned
    And the page metadata is page 1 size 5

  Scenario: A-AC7 courses sort by createdAt
    When the client searches courses with "sort=createdAt"
    Then the courses are sorted by createdAt

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

  Scenario: A-AC9 no matches return an empty list
    When the client searches courses with "q=zzzz-nothing"
    Then the response status is 200
    And no courses are returned
