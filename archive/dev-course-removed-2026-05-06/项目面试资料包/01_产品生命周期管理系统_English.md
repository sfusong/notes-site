# Product Lifecycle Management System Interview Notes

This is an interview-ready English version for speaking. It is not meant to overstate scope. Use the parts you can explain steadily.

## 1. 30-second version

This was an internal business system built to manage key lifecycle events for wealth management products.  
It mainly covered two scenarios: dividend preparation for closed-end products, and early-maturity reminders for target-return products once yield conditions were met.  
I participated in the actual development using `Java Spring Boot + React`, and the core value was to translate business rules into executable reminder logic before the larger product management system was fully launched.

## 2. 1-minute version

The project was essentially a rule-driven internal system.  
Instead of relying on manual follow-up, the system determined when a product had entered a critical lifecycle window and generated reminders for the relevant roles, such as product managers or investment managers.

From a technical perspective, the frontend was built with React for task lists, status pages and rule-related operations, while the backend was built with Spring Boot for business logic, APIs, scheduled processing and data persistence.

What I found most valuable was that this was not just a CRUD system. The key challenge was how to turn business concepts such as inception date, business calendar, dividend schedule and target yield threshold into stable system logic.

## 3. Confirmed facts

- Internal business system in a wealth management context
- Stack: `Java Spring Boot + React`
- Main scenarios:
  - dividend preparation reminder for closed-end products
  - early-maturity reminder for target-return products
- Rule inputs include:
  - inception date
  - business calendar
  - dividend plan
  - yield threshold condition
- It served business needs before the larger product management platform was fully available

## 4. Architecture framing

You can explain it like this:

```text
React frontend
  -> event list / reminder task pages / configuration pages
  -> calls Spring Boot APIs

Spring Boot backend
  -> product master data lookup
  -> lifecycle rule evaluation
  -> scheduled scan or batch processing
  -> reminder record persistence
  -> task status updates

Database
  -> product basic information
  -> dividend plans
  -> target-return rules
  -> reminder records
  -> status transition records
```

## 5. What I personally contributed

A safe way to say it:

- I had real development involvement in the project
- I was more involved on the backend and business-rule side
- I also participated in frontend-backend integration
- My work was closer to system implementation and rule logic, not just requirement coordination

## 6. What the interviewer may care about

For an architecture-oriented interviewer, the important point is not the UI.  
The important point is that this system sits between business rules and operational execution.

You can emphasize:

- rule expression
- date and calendar handling
- task generation
- state tracking
- reducing operational risk from missed lifecycle events

## 7. High-probability questions

### Q1. Why build this as a separate system instead of waiting for the main product management platform?

Because the business need already existed, while the main platform had a longer delivery cycle.  
Lifecycle reminders were operationally important, so it made sense to build a focused solution first and later integrate the capability into a bigger platform.

### Q2. What was the hardest part technically?

The hardest part was not the framework itself. It was how to convert business rules into reliable system logic.  
The reminder timing was not based on simple calendar dates. It depended on product type, business calendar, dividend schedule and yield conditions.

### Q3. How did the system decide when to trigger a reminder?

The system read different rules based on product type.  
For closed-end products, it evaluated preparation windows using inception date, business calendar and dividend plan.  
For target-return products, it checked whether yield conditions had been met and then moved the product into an early-maturity reminder workflow.

### Q4. Why Spring Boot for this project?

Because this was a typical enterprise internal system with APIs, service logic, scheduled processing and data access.  
Spring Boot is mature, efficient and easier to integrate with other internal systems later.

### Q5. What business value did the system create?

It turned a process that could easily depend on manual memory or ad hoc tracking into a structured and trackable workflow.  
That reduced the risk of missing key lifecycle events and supported business operations before the larger platform was ready.

## 8. Good English lines to reuse

- “The core challenge was translating business rules into system-executable logic.”
- “This was a rule-driven internal system rather than a technically complex distributed platform.”
- “The real value was reducing operational risk by making lifecycle events traceable and actionable.”
- “I was more involved on the backend and rule-implementation side, while also participating in integration with the frontend.”

## 9. Safe boundaries

Do not overclaim the following unless you are very sure:

- owning the full architecture independently
- building a distributed high-concurrency platform
- using message queues or complex scheduling infrastructure
- designing the entire enterprise product platform
