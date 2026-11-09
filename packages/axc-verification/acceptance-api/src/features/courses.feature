Feature: Course catalog through the running API host
 Scenario Outline: Search and pagination
  When the catalog client requests "<query>"
  Then the catalog returns IDs "<ids>" with page <page> size <size> total <total> pages <pages>
  Examples:
   | query | ids | page | size | total | pages |
   | | 001,002,003,004,005,006,007,008,009,010 | 1 | 10 | 12 | 2 |
   | ?q=SECURITY | 001,002,004,005 | 1 | 10 | 4 | 1 |
   | ?modality=online | 001,002,003,005,010 | 1 | 10 | 5 | 1 |
   | ?status=active | 001,002,003,004,006,011,012 | 1 | 10 | 7 | 1 |
   | ?tag=AI | 001,004,007 | 1 | 10 | 3 | 1 |
   | ?q=security&modality=online&status=active | 001,002 | 1 | 10 | 2 | 1 |
   | ?tag=cloud&status=active | 002,011 | 1 | 10 | 2 | 1 |
   | ?page=2&pageSize=5 | 006,007,008,009,010 | 2 | 5 | 12 | 3 |
   | ?sort=createdAt&pageSize=5 | 012,011,010,009,008 | 1 | 5 | 12 | 3 |
   | ?sort=updatedAt&pageSize=5 | 001,002,003,004,005 | 1 | 5 | 12 | 3 |
   | ?q=unmatched | | 1 | 10 | 0 | 0 |
 Scenario Outline: Invalid catalog input
  When the catalog client requests "<query>"
  Then the catalog rejects the query with status 400 and code INVALID_QUERY_PARAMETER
  Examples:
   | query |
   | ?modality=bad |
   | ?status=bad |
   | ?page=0 |
   | ?pageSize=51 |
   | ?sort=bad |
