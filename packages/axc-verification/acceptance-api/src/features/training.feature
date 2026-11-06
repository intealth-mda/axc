Feature: Course search and enrollment workflow
  Scenario: Search, request, review, and cancel a training enrollment
    When the client completes the training enrollment workflow
    Then the composed training workflow has passed
