Feature: Course catalog search

 Scenario: A-AC1 default list
  When the catalog client requests "/api/courses"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002,course-003,course-004,course-005,course-006,course-007,course-008,course-009,course-010"
  And the catalog pagination is "1,10,12,2"

 Scenario: A-AC2 keyword covers title summary and tags
  When the catalog client requests "/api/courses?q=SeCuRiTy"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002,course-003,course-008,course-012"
  And the catalog pagination is "1,10,5,1"

 Scenario: A-AC3 online modality
  When the catalog client requests "/api/courses?modality=online"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002,course-006,course-009"
  And the catalog pagination is "1,10,4,1"

 Scenario: A-AC4 active status
  When the catalog client requests "/api/courses?status=active"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002,course-004,course-005,course-007,course-011"
  And the catalog pagination is "1,10,6,1"

 Scenario: A-AC5 case insensitive exact tag
  When the catalog client requests "/api/courses?tag=AI"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-005,course-011"
  And the catalog pagination is "1,10,3,1"

 Scenario: A-AC6 first page of five
  When the catalog client requests "/api/courses?page=1&pageSize=5"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002,course-003,course-004,course-005"
  And the catalog pagination is "1,5,12,3"

 Scenario: A-AC6 second page
  When the catalog client requests "/api/courses?page=2&pageSize=5"
  Then the catalog response status is 200
  And the catalog course ids are "course-006,course-007,course-008,course-009,course-010"
  And the catalog pagination is "2,5,12,3"

 Scenario: A-AC7 created date ascending
  When the catalog client requests "/api/courses?sort=createdAt&pageSize=50"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002,course-003,course-004,course-005,course-006,course-007,course-008,course-009,course-010,course-011,course-012"
  And the catalog pagination is "1,50,12,1"

 Scenario: A8 updated date ascending
  When the catalog client requests "/api/courses?sort=updatedAt&pageSize=50"
  Then the catalog response status is 200
  And the catalog course ids are "course-012,course-011,course-010,course-009,course-008,course-007,course-006,course-005,course-004,course-003,course-002,course-001"
  And the catalog pagination is "1,50,12,1"

 Scenario: A-AC9 no matches
  When the catalog client requests "/api/courses?q=zzzz"
  Then the catalog response status is 200
  And the catalog course ids are ""
  And the catalog pagination is "1,10,0,0"

 Scenario: A-AC11 keyword modality and status
  When the catalog client requests "/api/courses?q=security&modality=online&status=active"
  Then the catalog response status is 200
  And the catalog course ids are "course-001,course-002"
  And the catalog pagination is "1,10,2,1"

 Scenario: A-AC11 modality status and tag
  When the catalog client requests "/api/courses?modality=hybrid&status=active&tag=ai"
  Then the catalog response status is 200
  And the catalog course ids are "course-005,course-011"
  And the catalog pagination is "1,10,2,1"

 Scenario Outline: A-AC8 invalid <query> returns the error contract
  When the catalog client requests "/api/courses?<query>"
  Then the catalog response status is 400
  And the catalog validation field is "<field>"

  Examples:
   | query | field |
   | modality=remote | modality |
   | status=bad | status |
   | page=0 | page |
   | page=1.5 | page |
   | page=9007199254740992 | page |
   | pageSize=51 | pageSize |
   | pageSize= | pageSize |
   | sort=bad | sort |
   | q= | q |
   | tag= | tag |
