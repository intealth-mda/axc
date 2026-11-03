Feature: Course catalog search

  Scenario: A-AC1 default list is paginated with page 1 and pageSize 10
    When the client requests "/api/courses"
    Then the courses response status is 200
    And the response has page 1, pageSize 10, totalItems 12 and 10 items

  Scenario: A-AC2 keyword search matches title, summary or tags regardless of case
    When the client requests "/api/courses?q=SeCuRiTy"
    Then the courses response status is 200
    And the returned course ids are "course-001,course-005,course-009"

  Scenario: A-AC3 modality filter returns only online courses
    When the client requests "/api/courses?modality=online"
    Then every returned course has modality "online"

  Scenario: A-AC4 status filter returns only active courses
    When the client requests "/api/courses?status=active"
    Then every returned course has status "active"

  Scenario: A-AC5 tag filter returns courses with the ai tag case-insensitively
    When the client requests "/api/courses?tag=ai"
    Then the returned course ids are "course-001,course-007,course-003"

  Scenario: A-AC6 page and pageSize limit items and include metadata
    When the client requests "/api/courses?page=2&pageSize=5"
    Then the response has page 2, pageSize 5, totalItems 12 and 5 items
    And the response reports 3 total pages

  Scenario: A-AC7 sort by createdAt orders records ascending
    When the client requests "/api/courses?sort=createdAt&pageSize=50"
    Then the returned courses are sorted by "createdAt"

  Scenario Outline: A-AC8 invalid <field> returns 400 with the error envelope
    When the client requests "/api/courses?<query>"
    Then the courses response status is 400
    And the error names field "<field>"

    Examples:
      | query        | field    |
      | modality=web | modality |
      | status=live  | status   |
      | page=0       | page     |
      | page=abc     | page     |
      | pageSize=51  | pageSize |
      | sort=price   | sort     |

  Scenario: A-AC9 no matches returns 200 with empty items
    When the client requests "/api/courses?q=zzz-nothing"
    Then the courses response status is 200
    And the response has page 1, pageSize 10, totalItems 0 and 0 items

  Scenario: A-AC10 existing healthcheck still passes
    When the client requests the healthcheck
    Then the healthcheck responds with status 200

  Scenario: A-AC11 combined q, modality and status filters
    When the client requests "/api/courses?q=security&modality=online&status=active"
    Then the returned course ids are "course-001,course-009"

  Scenario: A-AC12 documentation is served for the endpoint
    Then the courses documentation lists the path, query parameters, success and error responses
