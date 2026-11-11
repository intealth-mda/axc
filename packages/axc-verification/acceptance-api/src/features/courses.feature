Feature: Course catalog search

  # ac-meta: A-AC10
  # ac-meta: A-AC11
  # ac-meta: A-AC12

  Scenario: A-AC1 GET /api/courses returns the default page
    When the client requests the course catalog
    Then the courses search responds with status 200
    And the courses page is 1
    And the courses page size is 10
    And the courses item count is 10
    And the courses total items is 12
    And the courses total pages is 2
    And the first course title is "Active Hybrid Security"

  Scenario: A-AC2 keyword search matches title, summary, or tags
    When the client requests courses with query "q=SeCuRiTy"
    Then the courses search responds with status 200
    And the course ids in order are "course-012,course-001,course-010,course-002"

  Scenario: A-AC3 modality filter returns online courses
    When the client requests courses with query "modality=online"
    Then the courses search responds with status 200
    And the courses total items is 5
    And every course modality is "online"

  Scenario: A-AC4 status filter returns active courses
    When the client requests courses with query "status=active"
    Then the courses search responds with status 200
    And the courses total items is 6
    And every course status is "active"

  Scenario: A-AC5 tag filter matches a tag regardless of case
    When the client requests courses with query "tag=AI"
    Then the courses search responds with status 200
    And the course ids in order are "course-001,course-009"

  Scenario: A-AC6 pagination limits the page
    When the client requests courses with query "page=1&pageSize=5"
    Then the courses search responds with status 200
    And the courses page is 1
    And the courses page size is 5
    And the courses item count is 5
    And the courses total items is 12
    And the courses total pages is 3

  Scenario: A-AC7 createdAt sort orders the catalog
    When the client requests courses with query "sort=createdAt&pageSize=50"
    Then the courses search responds with status 200
    And the courses are ordered by createdAt
    And the first course id is "course-005"

  Scenario: A-AC8 invalid query parameters return 400
    When the client requests courses with query "modality=nope&status=nope&page=0&pageSize=51&sort=nope"
    Then the courses search responds with status 400
    And the courses error code is "INVALID_QUERY_PARAMETER"
    And the courses error fields are "modality,page,pageSize,sort,status"

  Scenario: A-AC9 no matches return an empty page
    When the client requests courses with query "q=zzznomatch"
    Then the courses search responds with status 200
    And the courses item count is 0
    And the courses total items is 0
    And the courses total pages is 0
    And the courses page is 1
    And the courses page size is 10
