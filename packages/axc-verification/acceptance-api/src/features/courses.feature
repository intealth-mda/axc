Feature: Course catalog search

  Scenario: GET /api/courses returns the first page
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1 of size 10
    And the course catalog contains 12 courses
    And the course catalog returns 10 items

  Scenario: GET /api/courses applies keyword, modality, and status together
    When the client searches courses for "security" with modality "online" and status "active"
    Then the course catalog responds with status 200
    And the course catalog contains 2 courses
    And the course catalog titles are "AI Security Foundations" and "Threat Modeling"

  Scenario: GET /api/courses rejects an invalid page size
    When the client requests the course catalog with page size 51
    Then the course catalog responds with status 400
    And the course catalog error is an invalid page size
