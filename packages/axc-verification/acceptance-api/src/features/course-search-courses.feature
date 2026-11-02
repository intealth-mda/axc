Feature: Course SearchCourses

  Scenario: The client reads the default course page
    When the client requests course search courses
    Then course search courses responds with status 200
    And the course page is 1
    And the course page size is 10
    And the course item count is 10
    And the course total item count is 12
    And the courses are sorted by title

  Scenario: The client searches courses by keyword
    When the client requests course search courses with "q=security"
    Then course search courses responds with status 200
    And every course matches "security"

  Scenario: The client filters courses by modality
    When the client requests course search courses with "modality=online"
    Then course search courses responds with status 200
    And every course modality is "online"

  Scenario: The client filters courses by status
    When the client requests course search courses with "status=active"
    Then course search courses responds with status 200
    And every course status is "active"

  Scenario: The client filters courses by tag
    When the client requests course search courses with "tag=ai"
    Then course search courses responds with status 200
    And every course tag includes "ai"
    And the course total item count is 2

  Scenario: The client combines keyword modality and status
    When the client requests course search courses with "q=security&modality=online&status=active"
    Then course search courses responds with status 200
    And every course matches "security"
    And every course modality is "online"
    And every course status is "active"
    And the course total item count is 2

  Scenario: The client pages the course catalog
    When the client requests course search courses with "page=1&pageSize=5"
    Then course search courses responds with status 200
    And the course page is 1
    And the course page size is 5
    And the course item count is 5
    And the course total item count is 12
    And the course total page count is 3

  Scenario: The client sorts courses by created time
    When the client requests course search courses with "sort=createdAt&pageSize=12"
    Then course search courses responds with status 200
    And the courses are sorted by createdAt

  Scenario: The client sends an invalid modality
    When the client requests course search courses with "modality=classroom"
    Then course search courses responds with status 400
    And the course error code is "INVALID_QUERY_PARAMETER"
    And the course error field is "modality"

  Scenario: The client sends an invalid status
    When the client requests course search courses with "status=archived"
    Then course search courses responds with status 400
    And the course error field is "status"

  Scenario: The client sends an invalid page
    When the client requests course search courses with "page=0"
    Then course search courses responds with status 400
    And the course error field is "page"

  Scenario: The client sends an invalid page size
    When the client requests course search courses with "pageSize=51"
    Then course search courses responds with status 400
    And the course error field is "pageSize"

  Scenario: The client sends an invalid sort
    When the client requests course search courses with "sort=popularity"
    Then course search courses responds with status 400
    And the course error field is "sort"

  Scenario: The client searches for a missing course
    When the client requests course search courses with "q=zzzznotacourse"
    Then course search courses responds with status 200
    And the course item count is 0
    And the course total item count is 0
    And the course total page count is 0
