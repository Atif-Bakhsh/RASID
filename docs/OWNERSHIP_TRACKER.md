# RASID feature ownership tracker

Copy this section for each feature. A generated implementation is not proof that you own its reasoning.

Feature:

Files touched and the purpose of each:

Inputs and outputs:

Identity and ownership boundary:

Database transaction boundary:

Success test and what it proves:

Failure test and what it proves:

One edge case I reproduced manually:

One requirement I changed independently:

One rejected alternative and why:

What I still do not understand:

| Gate | Evidence or next action |
| --- | --- |
| Explain the request without notes | |
| Explain the SQL/ORM behavior | |
| Modify the feature without regenerating it | |
| Demonstrate a success and a failure | |
| Defend the ownership and transaction boundary | |
| Describe an operational failure and recovery | |
| Make one coherent commit explaining why | |

Suggested progression: environment and health → account DTOs → auth/session state → owned transactions → CSV preview → transactional commit → analytics → budgets/rules → container and recovery. Return to the smallest unexplained concept whenever a gate fails.
