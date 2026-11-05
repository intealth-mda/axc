Feature: Course catalog search

  Scenario: Default catalog page
    When the client searches courses with ""
    Then the course search status is 200
    And the course search page is 1 and page size is 10
    And the course search total items is 13
    And the course search first title is "Access Control Primer"

  Scenario: Keyword search is case insensitive
    When the client searches courses with "?q=SECURITY"
    Then the course search status is 200
    And the course search total items is 4
    And the course search titles are "Access Control Primer", "AI Security Foundations", "Data Privacy Basics", and "Workshop Safety"

  Scenario: Modality filter
    When the client searches courses with "?modality=online"
    Then the course search status is 200
    And the course search total items is 5
    And every course modality is "online"

  Scenario: Status filter
    When the client searches courses with "?status=active"
    Then the course search status is 200
    And the course search total items is 5
    And every course status is "active"

  Scenario: Tag filter is case insensitive
    When the client searches courses with "?tag=AI"
    Then the course search status is 200
    And the course search total items is 2
    And the course search titles are "Active Hybrid Coaching" and "AI Security Foundations"

  Scenario: Combined keyword modality and status
    When the client searches courses with "?q=security&modality=online&status=active"
    Then the course search status is 200
    And the course search total items is 1
    And the course search first title is "AI Security Foundations"

  Scenario: Pagination
    When the client searches courses with "?page=1&pageSize=5"
    Then the course search status is 200
    And the course search page is 1 and page size is 5
    And the course search item count is 5
    And the course search total items is 13
    And the course search total pages is 3

  Scenario: Sort by created at
    When the client searches courses with "?sort=createdAt"
    Then the course search status is 200
    And the course search first title is "Example title"
    And the course search second title is "Workshop Safety"

  Scenario: Invalid modality
    When the client searches courses with "?modality=remote"
    Then the course search status is 400
    And the course search error field is "modality"

  Scenario: Invalid status
    When the client searches courses with "?status=published"
    Then the course search status is 400
    And the course search error field is "status"

  Scenario: Invalid page
    When the client searches courses with "?page=0"
    Then the course search status is 400
    And the course search error field is "page"

  Scenario: Invalid page size
    When the client searches courses with "?pageSize=51"
    Then the course search status is 400
    And the course search error field is "pageSize"

  Scenario: Invalid sort
    When the client searches courses with "?sort=name"
    Then the course search status is 400
    And the course search error field is "sort"

  Scenario: No matching courses
    When the client searches courses with "?q=zzzz-no-course"
    Then the course search status is 200
    And the course search item count is 0
    And the course search total items is 0
    And the course search total pages is 0
    And the course search page is 1 and page size is 10
