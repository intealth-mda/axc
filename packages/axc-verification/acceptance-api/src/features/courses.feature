Feature: Course catalog search
 Scenario: A-AC1 Default paginated course list
  When the catalog client requests "/api/courses"
  Then the catalog status is 200
  And the catalog metadata is page 1 size 10 total 12 pages 2
  And the catalog has 10 complete course records
  And the catalog is sorted by "title"

 Scenario: A-AC2 Case insensitive keyword matches title summary and tags
  When the catalog client requests "/api/courses?q=SeCuRiTy"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-007,course-009"

 Scenario: A-AC3 Online modality filter
  When the catalog client requests "/api/courses?modality=online"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-004,course-007,course-010"

 Scenario: A-AC4 Active status filter
  When the catalog client requests "/api/courses?status=active"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-004,course-007,course-010"

 Scenario: A-AC5 Case insensitive whole tag filter
  When the catalog client requests "/api/courses?tag=AI"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002"

 Scenario: A-AC6 Explicit pagination
  When the catalog client requests "/api/courses?page=1&pageSize=5"
  Then the catalog status is 200
  And the catalog metadata is page 1 size 5 total 12 pages 3
  And the catalog ids are "course-001,course-002,course-003,course-004,course-005"

 Scenario: A-AC6 Second page
  When the catalog client requests "/api/courses?page=2&pageSize=5"
  Then the catalog status is 200
  And the catalog metadata is page 2 size 5 total 12 pages 3
  And the catalog ids are "course-006,course-007,course-008,course-009,course-010"

 Scenario Outline: A-AC7 Supported ascending sort fields
  When the catalog client requests "/api/courses?sort=<sort>&pageSize=50"
  Then the catalog status is 200
  And the catalog has 12 complete course records
  And the catalog is sorted by "<sort>"
  Examples:
   | sort      |
   | title     |
   | createdAt |
   | updatedAt |

 Scenario Outline: A-AC8 Invalid query values
  When the catalog client requests "/api/courses?<query>"
  Then the catalog status is 400
  And the catalog error identifies "<field>"
  Examples:
   | query                         | field    |
   | modality=bad                  | modality |
   | status=bad                    | status   |
   | page=0                        | page     |
   | page=1.5                      | page     |
   | page=99999999999999999999     | page     |
   | pageSize=51                   | pageSize |
   | pageSize=-1                   | pageSize |
   | sort=bad                      | sort     |
   | q=                            | q        |
   | tag=                          | tag      |
   | page=                         | page     |
   | unknown=x                     | unknown  |
   | page=1&page=2                 | page     |

 Scenario: A-AC9 No matching courses
  When the catalog client requests "/api/courses?q=zzzz-no-match"
  Then the catalog status is 200
  And the catalog metadata is page 1 size 10 total 0 pages 0
  And the catalog ids are ""

 Scenario: A-AC10 Existing health route remains healthy
  When the catalog client requests "/health"
  Then the catalog status is 200

 Scenario: A-AC11 Keyword modality and status combined
  When the catalog client requests "/api/courses?q=security&modality=online&status=active"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-007"

 Scenario: A-AC11 Tag and modality combined
  When the catalog client requests "/api/courses?tag=ai&modality=in-person"
  Then the catalog status is 200
  And the catalog ids are "course-002"
