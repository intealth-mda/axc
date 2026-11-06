Feature: Query courses
 Scenario: Valid searches read through the injected repository
  When a valid course search is submitted
  Then the repository result is returned
 Scenario: Invalid searches fail before reading
  When an invalid course search is submitted
  Then every validation problem is reported without reading
