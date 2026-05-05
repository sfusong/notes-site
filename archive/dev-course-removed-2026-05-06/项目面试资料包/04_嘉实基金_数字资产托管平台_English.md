# Harvest Fund Digital Asset Custody Platform Interview Notes

This project is best presented as a full-stack prototype plus Web3-related scenario exploration, not as a large-scale production blockchain platform.

## 1. 30-second version

This was a prototype for a digital asset custody platform at Harvest Fund.  
I worked on both the frontend and backend. On the frontend, I used React to build pages for users, accounts, transfers, counterparties and asset management. On the backend, I used `Node.js / Express` together with `Sequelize`, `Swagger`, `JWT` and `Bcrypt` to implement services, data models, authentication and API documentation.  
I also had exposure to custody wallet scenarios, on-chain interaction concepts and smart-contract-related use cases.

## 2. 1-minute version

From an engineering perspective, this was a classic front-end / back-end separated prototype.  
The frontend focused on business-facing pages and workflows, while the backend exposed RESTful APIs, handled data models and implemented authentication.

What made the project interesting was that it was not only a normal management system.  
It also touched the Web3 custody context, which required thinking about wallets, asset ownership, on-chain interaction and how traditional platform capabilities might evolve into digital asset scenarios.

## 3. Confirmed facts

- Frontend: `HTML / CSS / JavaScript / React`
- Main functions:
  - user management
  - account management
  - transfer management
  - counterparty management
  - asset management
- Backend: `Node.js / Express`
- API style: `RESTful API`
- ORM: `Sequelize`
- API docs: `Swagger`
- Authentication: `JWT + Bcrypt`
- Web3-related exposure:
  - custody wallet
  - smart contract concepts
  - hot wallet concepts

## 4. Architecture framing

```text
React frontend
  -> user / account / transfer / asset pages
  -> calls RESTful APIs

Express backend
  -> routes / controllers
  -> business logic
  -> Sequelize ORM
  -> database

Authentication layer
  -> Bcrypt for password hashing
  -> JWT for authenticated API access

Web3 scenario exploration
  -> wallet custody
  -> on-chain interaction concepts
  -> smart-contract use cases
```

## 5. What I would emphasize

The strongest way to present this project is:

- full-stack prototype experience
- authentication and API design experience
- first serious exposure to Web3 custody scenarios
- understanding how traditional platform engineering meets new asset forms

## 6. High-probability questions

### Q1. What was this platform trying to validate?

It was mainly validating how a custody-oriented platform could support core management capabilities such as users, accounts, transfers and assets in a separated frontend-backend architecture, while also exploring future Web3-related scenarios.

### Q2. What exactly did you work on?

I worked on both sides.  
On the frontend, I built business pages with React.  
On the backend, I implemented RESTful services with Node.js and Express, and worked with Sequelize, Swagger, JWT and Bcrypt for data modeling, API documentation and authentication.

### Q3. Why use JWT and Bcrypt?

Because they are standard and practical choices for authentication.  
Bcrypt is used for secure password hashing, and JWT is used to maintain authenticated access after login.

### Q4. What role did Swagger play?

Swagger helped keep the API contract clear, which was especially helpful in a prototype project because it improved testing, integration and communication between frontend and backend.

### Q5. How deep was your Web3 involvement?

I would describe it as scenario research and prototype-related exposure rather than claiming I built a complete production blockchain platform.  
I became familiar with custody wallet concepts, on-chain interaction ideas and the role of smart contracts in business workflows.

### Q6. What was the biggest learning from this project?

It was my first time connecting frontend, backend, authentication and emerging Web3 scenario thinking in one project, instead of working on only one isolated technical layer.

## 7. Good English lines to reuse

- “I would position it as a full-stack prototype with Web3 scenario exploration.”
- “The project helped me connect platform engineering with digital asset custody concepts.”
- “I am careful not to overstate it as a production blockchain platform, but it gave me solid exposure to the custody domain.”

## 8. Safe boundaries

Do not overclaim:

- that you built a real large-scale on-chain production system
- that you designed core blockchain protocols
- that the smart-contract part was the main engineering scope if it was not
