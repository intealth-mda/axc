Feature: Enrollment request rules
 Scenario: Creation starts pending with an audit entry
  When a valid enrollment is constructed
  Then it is pending with its initial audit entry
 Scenario: Every permitted transition records an audit entry
  When all permitted transitions are exercised
  Then their histories retain the actor and reason
 Scenario: Forbidden transitions leave the aggregate unchanged
  When every forbidden transition is attempted
  Then each fails without changing state or history
 Scenario: Inputs are validated at the domain boundary
  When invalid creation and update inputs are used
  Then all input problems are reported
