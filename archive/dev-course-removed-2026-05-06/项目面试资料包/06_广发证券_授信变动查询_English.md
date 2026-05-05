# Credit Change Query Interview Notes

This project is strong for showing backend logic, data modeling and business-rule translation in a financial system.

## 1. 30-second version

This was a backend feature in a client credit management system.  
The goal was to help risk-control users directly understand whether a client's currently effective credit line had most recently increased, decreased or been newly added, instead of manually comparing historical records.  
My work included PostgreSQL schema adjustment, historical data backfill, change-direction logic, list and count APIs, and CSV export.

## 2. 1-minute version

The business problem was simple to describe but non-trivial to implement well.  
Users wanted to see the latest change direction of an effective credit line, but that information did not exist directly as a business-friendly field.

So the system had to identify the current effective record, find the previous valid record for the same counterparty, compare the two values, derive the change direction, and expose the result through query and export capabilities.  
From an engineering standpoint, it involved both data-layer work and application-layer logic.

## 3. Confirmed facts

- System: client credit management system
- Feature: credit change query
- Database: `PostgreSQL`
- Layered architecture keywords:
  - `Controller`
  - `Service`
  - `Mapper`
  - `FeignClient`
- Work involved:
  - schema adjustment
  - data update / backfill
  - list / count APIs
  - CSV export

## 4. Core business logic

You can describe it like this:

1. Identify the currently effective credit record  
2. Find the previous valid record for the same counterparty  
3. Compare the old and new credit amount  
4. Derive a change direction such as increase, decrease or new  
5. Expose the result through query and export

This is a good line:

“Technically, we turned raw historical credit records into a business-readable change view for risk-control users.”

## 5. Architecture framing

```text
Frontend query page
  -> Controller
  -> Service
     -> change-direction logic
     -> previous-record lookup
  -> Mapper / SQL
  -> PostgreSQL

Additional capabilities
  -> count API
  -> CSV export
```

## 6. What I would emphasize

This project is useful for showing:

- relational data thinking
- business rule implementation
- historical data backfill
- user-oriented query feature design

It is not a flashy system, but it is very believable and very relevant to financial engineering work.

## 7. High-probability questions

### Q1. What problem did the feature solve?

It allowed risk-control users to directly see whether a currently effective credit line had gone up, down or was newly added, without manually checking historical records one by one.

### Q2. How did you determine the change direction?

The system first identified the current effective record, then found the previous valid record for the same counterparty, and compared the two credit amounts.  
If there was no valid previous record in the required continuity condition, it was treated as new.

### Q3. Why did you need schema changes?

Because once a business concept becomes a stable query capability, the data layer often needs to evolve to support it efficiently and consistently.

### Q4. Why was historical data backfill necessary?

Because new logic or fields do not automatically populate old records.  
If we wanted users to query historical data consistently, the existing data had to be updated according to the new business rule.

### Q5. Why did you separate list and count APIs?

Because that is a common backend pattern for paginated enterprise queries.  
The frontend usually needs both the current page of records and the total count.

### Q6. What was the hardest part?

The hardest part was turning a business-friendly concept like “credit change direction” into stable system logic, especially around record matching, edge cases and historical consistency.

## 8. Good English lines to reuse

- “The feature sounds simple, but it required careful data logic behind the scenes.”
- “A big part of the work was converting historical records into a business-readable change view.”
- “I touched both the database side and the application logic side in this feature.”

## 9. Safe boundaries

Do not overclaim:

- that you built the whole credit system
- that you designed a full risk engine
- that a single query feature was a distributed platform problem
