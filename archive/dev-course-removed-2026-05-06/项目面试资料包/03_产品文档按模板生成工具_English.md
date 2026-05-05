# Template-Based Product Document Generator Interview Notes

This note is meant for direct English speaking. The safest way to position it is as a lightweight but very practical automation project.

## 1. 30-second version

This was a lightweight Python automation tool used to generate product documents from templates.  
Before the larger product management system was fully launched, business users already had a strong need for document generation, so I built a smaller tool first.  
The core idea was to map structured product attributes into predefined template fields, so the document could be generated automatically instead of being assembled manually.

## 2. 1-minute version

The value of this project was not in producing a “smart document writer”.  
It was in taking structured product data and turning it into a repeatable document-generation process.

In practice, the tool used a template with placeholders, mapped structured fields to those placeholders, handled formatting or value normalization, and then generated the final product document.  
So the real engineering focus was on data structuring, field mapping and output consistency.

## 3. Confirmed facts

- Technology: `Python`
- Purpose: generate product documents based on templates
- Background: business needed document automation before the main product management system was online
- Method: template-based field mapping
- Value: reduce manual work and improve efficiency

## 4. Architecture framing

```text
Structured product data
  -> Python mapping layer
     -> field cleanup / formatting
     -> template substitution
  -> generated document output
```

Or even more simply:

```text
Input: product attributes and issue parameters
Process: mapping, transformation, default handling
Output: product document
```

## 5. What I would emphasize

The strongest message here is:

- I used a small tool to solve a real business bottleneck
- I focused on structure and repeatability, not manual copying
- I used engineering leverage before the large platform was ready

This is a good project to show practical problem solving.

## 6. High-probability questions

### Q1. Why build a tool instead of doing it manually?

Because the task was repetitive, high-frequency and rule-based.  
Manual assembly was time-consuming and error-prone, while the document structure itself was stable enough to justify automation.

### Q2. Why not wait for the main product system?

Because the business pain already existed.  
A larger platform takes time to deliver, so a lightweight automation tool was a practical way to solve the immediate problem first.

### Q3. What was the hardest part?

The hardest part was not generating the file itself.  
It was defining consistent field semantics and building a stable mapping between structured product attributes and template placeholders.

### Q4. What kind of data did the tool depend on?

It depended on structured product data rather than free-form text.  
That was important, because stable automation requires stable inputs.

### Q5. Why Python?

Because this was a lightweight internal automation scenario.  
Python is fast to build with, and it is convenient for text processing, file handling and quick iteration.

### Q6. What value did it create?

It reduced repetitive manual work, improved the consistency of generated documents, and allowed the business team to benefit from automation before the bigger system was ready.

## 7. Good English lines to reuse

- “The real challenge was not file generation, but field standardization and mapping design.”
- “This was a small tool, but it solved a real and repetitive business problem.”
- “I see it as a good example of delivering automation value before a larger platform is fully available.”

## 8. Safe boundaries

Do not overclaim:

- that it was an AI or NLP document-generation system
- that it generated all content from unstructured text
- specific Python libraries if you are not sure about them
