## Kick-Off Brainstorm

### Semester Objectives
- **Reduce technical debt** - Switch to ANU’s api (create a facade for it), bugs, gated check-in
- **Deployment** - (AWS?)
- **Extend degree builder functionality** - Double degrees, postgraduate, different years of degrees, improve metrics, fix MMs
- **Automated question and answer**
- **Persistence for the plans** so that they are stored between sessions, (also consider temporary code), export the degree program (image or pdf), login system (automatically get grades, possibly two log ins)
- **Operations** - SMART and Research

### Tom’s Suggestions
- Work alongside ANU to automate Q&A
- Movement away from neural network/ontology because too hard to deploy/scale
- Use ANU’s API (and create a facade for it)
- Double degrees, masters, 
- ‘Gated’ check in

### Joseph’s Suggestions
- Cookies to save browser session
- Login and account system to save plans
- Export plans to pdf and images, with notes
- Part-time and over-loads
- Add new sessions/years
- Double degrees
- Spring, Summer, Autumn, Winter courses
- Show ANU’s own recommended majors, minors, and specs
- Ability to get system to schedule courses for optimising study time
- Automatically show (relevant) M/M/Ss that can be completed in empty elective slots
- Recognise when M/M/Ss are incompatible with the degree and each other. 

### Manal’s Suggestions
- Refactor some of the existing code
- Include Double degrees, postgrads
- Use ANU’s API (and create a facade for it)
- The ability to create accounts and log in 
- Better model for recommendations
- A way to export degree plan to PDF/PNG

### Scarlett’s Suggestions
- In the first page, it does not recognise shortcut such as BIT (Bachelor of Information Technology). 
- Also, it does not return a list of relevant degrees if the spelling is incorrect. Nothing will show up. 
- I can select COMP2100 TWICE in the same semester and I received NO warning. 
- There is no options for gap year, part-time students, summer course, winter course etc. 
- Recommendation courses are not listed from easy to hard, from the first year to the last year. Suggest using SELT results. Sometimes 2000 level course is easier than 1000 level course. 
- When I scroll down in the course information section, I expect to scroll down “Related courses” rather than the whole window. Also, “Related courses” secion is a bit small. I can only view four courses at a time. 
- Some courses like ARTV2615 have a limited of enrolments. Only around 30 students can enrol this course in one semester. In this case, I wish I could make two plans at the same time. e.g.preference 1, preference 2...
- Also, some courses only run every 2 year. 
- Button “Reset/Clear Courses” only shows up if I move my mouse there. 
- When I moved my mouse to the right part of the course name from the sidebar, and then dragged it to my plan, the course name label does not really follow my mouse. There is a RELEVANT distance between my mouse and the course name label. 
- If I want to swap two courses, I need to delete them and then add them. I wish there is a “swap” button. 
- I wish there is a list of majors, minors, specialisations that I can select. Currently I can only search them, which assumes I have already known the names. 
- I suggest there is feedback from students who took this course before. Like a summary of SELT shown as a bar chart. 
- “Related courses” can be more intelligent. MATH1005, COMP2600, COMP2620 are all logic course. 
- When I do not meet the pre-requirement of enrolling the course , it only says I do not meet the requirement instead of saying which course I should study first. 
- A better UI

### Thien’s Suggestions
- Deploy on ANU’s servers / integrate into Wattle?
- Try scraping other Uni sites if we want to scale
- Perhaps add more documentation for code (who was going to maintain the code after the project ends?)
- Not so obvious: numpy, scipy and scikit-learn dependency isn’t mentioned in installation instructions
- Improve UI interface?
- SELT review scraping (not really necessary but thought it sounded cool)
- Enrolling in courses (stretch goal? Sounds hard connecting with isis...)
- What if someone fails a course or takes a gap year? (account for variant years)
- Bugs:
  - Can select more than 1 spec and 2 majors/minors
  - Reset degree plan doesn’t reset majors/minors/specs
  - Previous courses aren’t listed (e.g. comp2600)
  - Can select impossible majors (like Computer Science for BAC degrees)
  - Can drag major/minor/… boxes
  - “% students in your degree” seems abusable since it's based off form submissions (?)
  - Courses that only come every 2 years can be placed in odd years (e.g. COMP4610)
  - “Pick at least one” sounds confusing since it really means “pick (only) one”
  - “Incompatible course” errors not thrown for some edge-case courses (e.g. pick comp2140 first then comp1140)