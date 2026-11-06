Feature: Course catalog search

 Scenario: A-AC1 Default pagination
  When the catalog client requests "/api/courses"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-003,course-004,course-005,course-006,course-007,course-008,course-009,course-010"
  And the catalog pagination is 1, 10, 12, 2

 Scenario: A-AC2 Keyword matches title summary and tags ignoring case
  When the catalog client requests "/api/courses?q=sEcUrItY"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-003,course-009"
  And the catalog pagination is 1, 10, 4, 1

 Scenario: A-AC3 Online modality
  When the catalog client requests "/api/courses?modality=online"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-005,course-007,course-010"
  And the catalog pagination is 1, 10, 5, 1

 Scenario: A-AC4 Active status
  When the catalog client requests "/api/courses?status=active"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-004,course-006,course-009,course-010,course-012"
  And the catalog pagination is 1, 10, 7, 1

 Scenario: A-AC5 Case insensitive tag
  When the catalog client requests "/api/courses?tag=AI"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-007"
  And the catalog pagination is 1, 10, 2, 1

 Scenario: A-AC6 Explicit pagination
  When the catalog client requests "/api/courses?page=1&pageSize=5"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-003,course-004,course-005"
  And the catalog pagination is 1, 5, 12, 3

 Scenario: A-AC6 Second page
  When the catalog client requests "/api/courses?page=2&pageSize=5"
  Then the catalog status is 200
  And the catalog ids are "course-006,course-007,course-008,course-009,course-010"
  And the catalog pagination is 2, 5, 12, 3

 Scenario: A-AC7 Creation date sorting
  When the catalog client requests "/api/courses?sort=createdAt&pageSize=50"
  Then the catalog status is 200
  And the catalog ids are "course-012,course-011,course-010,course-009,course-008,course-007,course-006,course-005,course-004,course-003,course-002,course-001"
  And the catalog pagination is 1, 50, 12, 1

 Scenario: A8 Updated date sorting
  When the catalog client requests "/api/courses?sort=updatedAt&pageSize=50"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002,course-003,course-004,course-005,course-006,course-007,course-008,course-009,course-010,course-011,course-012"
  And the catalog pagination is 1, 50, 12, 1

 Scenario: A-AC9 No matching courses
  When the catalog client requests "/api/courses?q=unfindable"
  Then the catalog status is 200
  And the catalog ids are ""
  And the catalog pagination is 1, 10, 0, 0

 Scenario: A-AC11 Keyword modality and status combine
  When the catalog client requests "/api/courses?q=security&modality=online&status=active"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-002"
  And the catalog pagination is 1, 10, 2, 1

 Scenario: A-AC11 Tag and status combine
  When the catalog client requests "/api/courses?tag=security&status=active"
  Then the catalog status is 200
  And the catalog ids are "course-001,course-009"
  And the catalog pagination is 1, 10, 2, 1

 Scenario Outline: A-AC8 Invalid query parameters
  When the catalog client requests "/api/courses?<query>"
  Then the catalog status is 400
  And the catalog error identifies "<field>"
  Examples:
   | query | field |
   | modality=virtual | modality |
   | status=unknown | status |
   | page=0 | page |
   | page=1.5 | page |
   | page=9007199254740992 | page |
   | pageSize=51 | pageSize |
   | pageSize=0 | pageSize |
   | sort=id | sort |
   | tag= | tag |
   | q= | q |
   | modality= | modality |
   | unknown=x | unknown |
   | page=1&page=2 | page |
