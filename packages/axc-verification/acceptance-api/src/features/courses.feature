Feature: Course catalog search

  Scenario: GET /api/courses returns the default page
    When the client requests the course catalog
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 10
    And the course catalog returns 10 items
    And the course catalog total items is 12

  Scenario: GET /api/courses searches title summary and tags
    When the client requests the course catalog with "q=security"
    Then the course catalog responds with status 200
    And the course catalog total items is 6
    And the course catalog items include "AI Security Foundations"
    And the course catalog items include "Security Awareness for Managers"
    And the course catalog items include "Data Privacy Basics"
    And the course catalog items include "Workshop Safety"
    And the course catalog items include "Tag Only Match"
    And the course catalog items include "Everyday Communication"

  Scenario: GET /api/courses filters modality
    When the client requests the course catalog with "modality=online"
    Then the course catalog responds with status 200
    And the course catalog total items is 4

  Scenario: GET /api/courses filters status
    When the client requests the course catalog with "status=active"
    Then the course catalog responds with status 200
    And the course catalog total items is 6

  Scenario: GET /api/courses filters tag
    When the client requests the course catalog with "tag=AI"
    Then the course catalog responds with status 200
    And the course catalog total items is 3

  Scenario: GET /api/courses combines keyword modality and status
    When the client requests the course catalog with "q=security&modality=online&status=active"
    Then the course catalog responds with status 200
    And the course catalog total items is 2
    And the course catalog items include "AI Security Foundations"
    And the course catalog items include "Data Privacy Basics"

  Scenario: GET /api/courses paginates
    When the client requests the course catalog with "page=1&pageSize=5&sort=title"
    Then the course catalog responds with status 200
    And the course catalog page is 1
    And the course catalog page size is 5
    And the course catalog returns 5 items
    And the course catalog total pages is 3

  Scenario: GET /api/courses sorts by createdAt
    When the client requests the course catalog with "sort=createdAt&pageSize=12"
    Then the course catalog responds with status 200
    And the first course catalog title is "Retired In Person Seminar"

  Scenario: GET /api/courses rejects an invalid query
    When the client requests the course catalog with "modality=remote&page=0&pageSize=51&sort=rank"
    Then the course catalog responds with status 400
    And the course catalog error code is "INVALID_QUERY_PARAMETER"

  Scenario: GET /api/courses returns an empty page when nothing matches
    When the client requests the course catalog with "q=zzzz-not-a-course"
    Then the course catalog responds with status 200
    And the course catalog returns 0 items
    And the course catalog total items is 0
    And the course catalog total pages is 0
