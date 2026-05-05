# System and Delivery English Interview Pack

This pack helps you answer English interview questions about how systems run, how versions are released and how teams collaborate around delivery.

## 1. What this section is really about

This section is not meant to turn you into a DevOps expert.  
It is meant to help you sound like someone who has worked in real production delivery environments.

The key topics are:

- CI/CD
- Git and SDLC
- build and artifact flow
- Tomcat and Nginx
- reverse proxy and traffic entry
- rollout and release coordination

## 2. CI/CD in a practical way

The safest explanation is:

“CI/CD standardizes the path from code submission to build, artifact creation and deployment. In practice, what I have seen is closer to continuous delivery than fully automatic continuous deployment, because production rollout still happens in a controlled release window with manual triggering or approval.”

Important ideas:

- CI is about integration, build and validation after code submission
- CD can mean continuous delivery or continuous deployment
- many enterprise environments are closer to continuous delivery

## 3. Git and SDLC

You do not need to sound like a Git expert.  
You need to sound like someone who understands team collaboration.

A safe explanation:

“Git is the version-control tool that supports branch-based collaboration, history tracking and controlled integration. SDLC is the broader lifecycle from requirement, development, testing and release to ongoing maintenance.”

Good practical flow:

1. pull the latest code  
2. work on a branch  
3. commit locally  
4. push remotely  
5. merge into the integration or main branch  
6. enter build, test and release flow

## 4. Tomcat and Nginx

This is one of the most common interview topics.

The clean explanation is:

“Tomcat is mainly the runtime container for Java web applications, while Nginx is more often used as the traffic entry layer for reverse proxy, static resources, routing and load balancing. In many real systems, Nginx sits in front and forwards business requests to Java services running on Tomcat or embedded Tomcat.”

## 5. Reverse proxy and traffic entry

You can explain it simply:

- Nginx receives the request first
- it may serve static resources directly
- or forward the request to backend services
- this creates a unified entry and cleaner routing structure

Why it matters:

- easier traffic control
- cleaner exposure of backend services
- better production manageability

## 6. Build artifacts and release flow

Another strong point for English interviews:

“An artifact is the output of a build, such as a deployable package. Using an artifact repository helps keep deployment versions consistent across environments and makes rollback or traceability easier.”

You can also say:

- build once, deploy the same artifact
- avoid rebuilding differently in every environment
- keep version history clearer

## 7. What the interviewer is really testing

Usually they are not testing whether you can design a platform from scratch.  
They want to know:

- have you seen real release flow?
- do you understand where your code goes after development?
- do you understand the relationship between build, artifact and deployment?

## 8. Good English lines to reuse

- “My understanding of CI/CD is mainly from the perspective of engineering delivery rather than platform ownership.”
- “The environments I worked in were closer to continuous delivery than fully automated production deployment.”
- “Tomcat is more about running Java applications, while Nginx is more about traffic entry and request forwarding.”
- “I care about release flow because production stability depends not only on code, but also on controlled rollout.”

## 9. Safe boundaries

Avoid overclaiming:

- owning the CI/CD platform design
- building a full internal deployment platform yourself
- being a dedicated infrastructure or DevOps engineer if that was not your role
