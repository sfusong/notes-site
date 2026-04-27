# Apprentice AI Operations Layer Interview Notes

This English version is optimized for live interview speaking, especially for interviewers who care about system boundary, control and architecture.

## 1. 30-second version

Apprentice is a configuration-driven AI operations layer for enterprise systems.  
It is not just a chatbot. The goal was to validate a closed loop: understand a user request in natural language, fill missing parameters, and execute a real backend operation within a controlled boundary.  
The prototype was built with `FastAPI + React/Vite + YAML configuration`, and used a `Spring Boot` reference business system behind it.

## 2. 1-minute version

What I wanted to explore with Apprentice was whether AI could move from “answering questions” to “helping people operate real enterprise systems safely”.

So the design had a few important layers.  
The YAML layer described what operations were allowed and what parameters were required.  
The orchestration layer interpreted the user's intent and filled missing arguments.  
The executor layer was the boundary between the model and the real business system.  
And the profile layer learned from audit logs and recurring user behavior to improve later suggestions.

This made the system much more controlled than directly letting a model generate arbitrary requests.

## 3. Confirmed facts

- Agent backend: `FastAPI`
- Frontend: `React + Vite`
- Configuration layer: `YAML`
- Execution boundary: `Executor`
- Profile storage: `JSON`
- LLM interface: `OpenRouter / OpenAI-compatible`
- Reference business system: `Spring Boot + Spring Security + Spring Data JPA`
- Data store: `H2`
- Audit logging: `AOP-based`

## 4. Core architecture

```text
Employee
  -> React frontend
  -> FastAPI agent API
     -> YAML capability config
     -> profile store
     -> LLM
     -> executor boundary
        -> Spring Boot business system
           -> business data + audit logs
```

## 5. What I would emphasize in the interview

This project is strong if you position it as a systems project, not just an AI demo.

The strongest points are:

- controlled execution boundary
- configuration-driven capability definition
- auditability
- profile-based assistance
- portability across enterprise systems

## 6. Why the architecture matters

The key architectural decision was that the model should not directly control the backend system.

Instead:

- the configuration layer defines what is allowed
- the orchestration layer interprets intent
- the executor layer validates and performs the action
- the audit layer records what happened

That separation is what makes the idea more engineering-oriented and more suitable for enterprise use.

## 7. High-probability questions

### Q1. How is this different from a normal chatbot?

A normal chatbot mainly returns text.  
Apprentice was designed to connect natural language input to real business actions.  
The goal was to move from “answering” to “operating”, but still within a controlled boundary.

### Q2. Why use YAML instead of hardcoding everything in prompts?

Because I wanted the operation model to be portable and explicit.  
With YAML, the system capabilities, field definitions, required parameters and semantic hints are separated from the model prompt.  
That makes the system easier to maintain and easier to adapt to a second business system later.

### Q3. Why do you need an executor boundary?

Because the model itself should not be allowed to freely call production-like APIs.  
The executor acts as a control point for validation, token handling, request assembly and error management.  
Without that boundary, the system would be much harder to trust.

### Q4. Why did you add profile learning?

Because enterprise operations are often repetitive.  
People tend to use similar operations, similar field values and similar working patterns.  
If we structure that information, the system can make better suggestions and reduce input friction over time.

### Q5. What was the hardest part?

The hardest part was balancing model flexibility and system control.  
I did not want the system to become either a static form engine or an unsafe autonomous agent.  
That is why the configuration layer, executor boundary and audit log all mattered.

### Q6. Is this production-ready?

I would describe it as a working prototype, not a fully production-ready system.  
The purpose was to validate the product direction and the architectural feasibility of controlled AI operations in enterprise systems.

## 8. Good English lines to reuse

- “I wanted to explore whether AI could safely move from answering to operating.”
- “The key design choice was to keep the model inside a controlled execution boundary.”
- “I treated configuration, execution and auditability as first-class concerns.”
- “The project was less about building a chatbot and more about building an enterprise operation framework around AI.”

## 9. Safe boundaries

Avoid overclaiming these points:

- that it already supports many real production systems
- that the model can freely invoke arbitrary internal APIs
- that it is already a mature enterprise platform
- that you solved all governance and security problems end to end
