Feature: update
 Scenario: update enforces its use case contract
  When the use case is called directly
  Then its successful results and failures obey the contract
