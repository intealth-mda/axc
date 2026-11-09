Feature: Course search
 Scenario: A-AC1 B-AC1 Default catalog
  When the catalog is searched with ""
  Then the catalog has default pagination
 Scenario: A-AC2 Keyword title search
  When the catalog is searched with "?q=AI%20SECURITY%20FOUNDATIONS"
  Then the catalog contains exactly courses "course-001"
 Scenario: A-AC2 Keyword summary search
  When the catalog is searched with "?q=CONNECTIVITY"
  Then the catalog contains exactly courses "course-011"
 Scenario: A-AC2 Keyword tag search
  When the catalog is searched with "?q=MAINTENANCE"
  Then the catalog contains exactly courses "course-005"
 Scenario: A-AC3 Modality
  When the catalog is searched with "?modality=online"
  Then the catalog field "modality" equals "online"
 Scenario: A-AC4 Active status
  When the catalog is searched with "?status=active"
  Then the catalog field "status" equals "active"
 Scenario: A-AC5 Case insensitive tag
  When the catalog is searched with "?tag=AI"
  Then the catalog contains exactly courses "course-007,course-001"
 Scenario: A-AC6 Pagination
  When the catalog is searched with "?page=2&pageSize=5"
  Then the catalog has five results on page two
 Scenario: A-AC7 Creation date sorting
  When the catalog is searched with "?sort=createdAt"
  Then the catalog is ordered by "createdAt"
 Scenario: A-AC7 Update date sorting
  When the catalog is searched with "?sort=updatedAt"
  Then the catalog is ordered by "updatedAt"
 Scenario: A-AC7 Default title sorting
  When the catalog is searched with ""
  Then the catalog is ordered by "title"
 Scenario: A-AC9 Empty result
  When the catalog is searched with "?q=no-such-course"
  Then the catalog contains exactly courses ""
 Scenario: A-AC11 Combined keyword modality status
  When the catalog is searched with "?q=security&modality=online&status=active"
  Then the catalog contains exactly courses "course-001,course-008"
 Scenario: A-AC11 Combined tag modality status
  When the catalog is searched with "?tag=ai&modality=hybrid&status=active"
  Then the catalog contains exactly courses "course-007"
 Scenario: A-AC8 Invalid modality=remote
  When the catalog is searched with "?modality=remote"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid status=bad
  When the catalog is searched with "?status=bad"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid page=0
  When the catalog is searched with "?page=0"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid page=-1
  When the catalog is searched with "?page=-1"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid page=1.5
  When the catalog is searched with "?page=1.5"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid page=99999999999999999999
  When the catalog is searched with "?page=99999999999999999999"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid pageSize=51
  When the catalog is searched with "?pageSize=51"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid pageSize=
  When the catalog is searched with "?pageSize="
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid sort=bad
  When the catalog is searched with "?sort=bad"
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid q=
  When the catalog is searched with "?q="
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
 Scenario: A-AC8 Invalid tag=
  When the catalog is searched with "?tag="
  Then the workflow responds with 400 and error "INVALID_QUERY_PARAMETER"
