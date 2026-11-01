Feature: Course catalog search

  Scenario: GET /api/courses returns the first page with default pagination
    When the client requests the course catalog with query ""
    Then the course catalog responds with status 200
    And the course page is page 1 of size 10 with 14 total items and 10 items

  Scenario: GET /api/courses filters by modality
    When the client requests the course catalog with query "modality=online"
    Then the course catalog responds with status 200
    And every returned course has modality "online"

  Scenario: GET /api/courses rejects an invalid pageSize
    When the client requests the course catalog with query "pageSize=51"
    Then the course catalog responds with status 400
    And the error lists field "pageSize" with message "pageSize must be between 1 and 50."
