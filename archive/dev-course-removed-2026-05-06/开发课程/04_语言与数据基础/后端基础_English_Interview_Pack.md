# Backend Fundamentals English Interview Pack

This pack helps you explain backend fundamentals in English without drifting into overly theoretical answers.

## 1. Spring Boot

The safest explanation:

“Spring Boot is a framework in the Spring ecosystem that helps build backend applications more quickly. It makes it easier to organize common capabilities such as APIs, business logic, database access, configuration and packaging into a runnable service.”

What matters in interviews:

- not deep source-code theory
- but whether you can explain how a real backend service is structured

## 2. REST API

You can explain it simply:

“REST APIs are HTTP-based interfaces through which the backend exposes business capabilities to the frontend or to other systems.”

A stronger line:

“An API is not just a URL. It is the boundary through which a system exposes its business capabilities.”

## 3. Typical backend layering

The standard chain you should be able to describe is:

```text
Request -> Controller -> Service -> Repository / DAO -> Database -> Response
```

A safe explanation:

- Controller receives the request and handles basic validation
- Service contains business rules and orchestration
- Repository or DAO handles database interaction

## 4. Request flow and validation

A common interview topic is what happens after an HTTP request enters the system.

A simple answer:

1. the frontend sends the request  
2. the controller receives it  
3. parameters are validated  
4. the service executes business logic  
5. the repository accesses the database  
6. the result is returned in a structured way

Why validation matters:

- backend is the real business boundary
- frontend validation is not enough
- invalid parameters should be blocked early

## 5. Unified response structure

You do not need to memorize one exact JSON format, but you should understand the value:

- consistency for frontend handling
- clearer success / failure semantics
- easier maintenance and troubleshooting

## 6. SQL and schema evolution

This is especially useful for your credit-change-query story.

A good explanation:

“SQL is the language used to interact with relational databases, and schema design is the process of turning business objects into stable data structures. In real systems, schema evolution is common because new features often require new fields, new indexes or new query support.”

Historical data backfill:

“Backfill is needed when old records must be adapted to a new data structure or new business logic, so that historical queries remain complete and consistent.”

## 7. Linux, Windows Server and IaC

You do not need to sound like an operations engineer.  
You need to sound like someone who understands the runtime environment.

Linux:

- common server environment
- logs, scripts, services and permissions matter

Windows Server:

- another common enterprise environment
- useful to understand especially in mixed infrastructure contexts

IaC:

- infrastructure as code
- the idea of describing infrastructure and environment configuration in a structured and repeatable way

## 8. Good English lines to reuse

- “I prefer to explain backend concepts through real system flow rather than isolated theory.”
- “In my experience, the important thing is not only writing an API, but making sure the API fits the business boundary and the delivery process.”
- “Validation matters because the backend is the real line of control.”
- “Schema changes are common in enterprise systems because business requirements evolve over time.”
- “I understand Linux and infrastructure topics mainly from the perspective of system runtime and delivery support.”

## 9. Safe boundaries

Avoid overclaiming:

- being a deep JVM expert if you are not
- being a DBA-level schema designer
- being a dedicated operations engineer
