
# AI Course Selection
A personalised course discovery experience that employs AI. Students can interact with a digital persona for personalised course information and selection support, completing transactions including enrolling in a course, selecting subjects and scheduling classes.

### [Semester 2 Project Progress](Documentation/Semester_2/overview.md)

#### [Semester 1 Project Progress](Documentation/Semester_1/overview.md)

These are overviews of the artifacts we have produced, organised by sprint and audit. They contain quick access to our outputs, documentation, and meeting notes. 

## Table of Contents

1. [Team Members](#team-members)

2. [Tools and Services](#tools-and-services)

3. [Milestones](#semester-2-milestones)

4. [Project Schedule](#semester-2-project-schedule)

5. [Process Changes](#semester-2-process-changes)

6. [Client's Vision](#clients-vision)

7. [Key Stakeholders](#key-stakeholders)

8. [Client and Stakeholder Expectations](#client-and-stakeholder-expectations)

9. [Project Impact](#project-impact)

10. [Technical and Other Constraints](#technical-and-other-constraints)

11. [Resources, Risks and Potential Costs](#resources-risks-and-potential-costs)

12. [NDA and IP Concerns](#nda-and-ip-concerns)

13. [References](#references)


## [Team Members](Documentation/Semester_2/Sprint_1/PDF/Team_Members.pdf)

![Team Organisation Chart](Documentation/Semester_2/Sprint_1/Images/Team_Members.png)

## Tools and Services
**Team communications**: Slack channel "AI Course Selection": http://courseai.slack.com/

**Project repository**: GitHub repository "courseai": https://github.com/AICourseSelection/courseai

**Task management**: Trello board "Tasks - Sem 2": https://trello.com/b/lNhn5e9R/tasks-sem-2

Related links:

- GitHub organisation "AICourseSelection" https://github.com/AICourseSelection
- Trello board "Tasks" (Semester 1): https://trello.com/b/QAxPOMSr/tasks
- Trello team "AI Course Selection": https://trello.com/aicourseselection

## Semester 2 Milestones

The plan for this semester includes five main work objectives. They are, in a rough order of priority, as follows:

1. **Deployment of the Service**: The Intelligent Course Scheduler (ICS) is to be deployed on a web server and made available for public use - all students and interested parties. This will allow us to conduct controlled and/or mass user testing at regular intervals during the development process. 
2. **Reduce Technical Debt**: Convert the ICS data model to one which takes advantage of the ANU's official source of data regarding all degree programs, majors, and courses. Eliminate bugs in the current system and refactor code for extensibility. Github Issues will be used to keep track of these. 
3. **Persistent Experience**: Allow users of the ICS to leave and come back to their session at a later time, track multiple plans, and export them to other formats. A follow-up goal is to connect to the ANU enrollments database to help automatically generate personalised degree plans. 
4. **Extend Degree Builder Functionality**: Implement additional features of the ICS to encompass a wider user base, allow more flexibility and increase ease of use. Features include Flexible Double Degrees, awareness of changing requirements, and improved metrics, among others. 
5. **Automated Question and Answer**: Improve upon the existing question and answer service, aiming to answer a much broader variety and larger number of potential questions about both the service and degree scheduling. 

For some of these objectives, such as #5, certain aspects within are not yet well-defined. Part of our time will be dedicated to 'research' tasks aimed at determining the feasibility and work involved in completing these tasks. The team has enough skill and diversity therein to support one or two members conducting research for part of a sprint. 

## [Semester 2 Project Schedule](Documentation/Semester_2/Sprint_1/PDF/Schedule.pdf)

![Project Schedule](Documentation/Semester_2/Sprint_1/Images/Schedule.png)
* **Kick-Off**: Weeks 1 - 2. Team member recruitment, onboarding, project definition and setup. 
* **Sprint 1**: Weeks 3 - 5. Project Audit 1, Deployment, Reduction of Technical Debt. 
  * Includes first round of user testing which immediately follows deployment. 
* **Sprint 2**: Weeks 6 - teaching break 2. Project Audit 2, and further objectives. 
  * Includes second round of user testing at the midpoint. 
* **Sprint 3**: Weeks 7 - 10. Completion of remaining objectives. 
  * Includes public user testing round at the beginning of week 7, and fourth testing round in week 9. 

## Semester 2 Process Changes

We aim to improve upon the design and development process from last semester in a number of ways. 

* **Longer Sprints**: We are increasing sprint times to three weeks each: allowing for better planning in each, as well as more flexibility. Each sprint will have a mid-sprint review and a retrospective. See the [schedule](Documentation/Semester_2/Sprint_1/PDF/Schedule.pdf). 

* **Regular User Testing**: We will conduct user testing at regular intervals during the development process. These sessions are scheduled for:

  1. Mid-sprint 1: 17/08 - 22/08
  2. Mid-sprint 2: 5/09 - 10/09
  3. End of sprint 2: 17/09 - 23/09 (public and open testing session)
  4. End of sprint 3: 3/10 - 6/10

  Three of these sessions will be with a small group of testers who will be re-used throughout the project.  One session (currently planned to be the 3rd session) will be open to the public and feedback channels will be available to anyone using the system. This allows us to receive a mix of both fresh and experienced opinions regarding our system. 

  Testing operations will be logged using [this template](Documentation/Semester_2/Sprint_1/Test_Template.docx) provided by Accenture. 

* **Clear Representation of Tasks**: Every work task will either :
  1. be well-defined and following the [S.M.A.R.T. criteria](https://en.wikipedia.org/wiki/SMART_criteria), or
  2. be a research task, with the goal of resolving the situation to create tasks of the first type.

  Research tasks will be created in a controlled fashion, so as to constitute no more than 20% of the team's efforts for any significant amount of time. 

* **Gated Check-in**: All significant or new contributions to the codebase will go through a code review process by at least one other team member. This will help with working towards objective #2 - Reduce Technical Debt. 


## Client's Vision

Vision: Empowering University Students to get the most out of their studies, through optimisation of course selection and scheduling.

Our project recommendation is to complete a proof of concept (POC) for a personalised course discovery experience employing Artificial Intelligence. Prospective or existing students would be able to interact with a digital persona for personalised course information and selection support, completing transactions including enrolling in a course, selecting subjects and scheduling classes.

This proof of concept matters because the university:
*   continually needs to improve its services to reinforce its position as a leading university, while differentiating itself by demonstrating its focus on innovation and technology
*   wants to make it as easy as possible for qualified students to select the right courses for them and become enduring members of the university’s community
*   wishes to provide great experiences to its prospective and existing students that build their continued engagement with the university.

## [Key Stakeholders](Documentation/Audit_1/PDF/Stakeholders.pdf)
![Image of Stakeholders](Documentation/Semester_1/Audit_1/Images/Stakeholders.png)

## Client and Stakeholder Expectations:
* Accenture
  * Demonstrate the value of using Artificial Intelligence systems.
* The Australian National University
  * Demonstrate the value of using Artificial Intelligence systems.
  * The team will meet all project deliverables within the schedule. 
  * Eventually demonstrate that this proof of concept is a viable solution for tertiary students to effortlessly engage in course selection and scheduling. 

## Project Impact
The aim of this project is to simplify the course selection process for university students. AI technology, particularly that which is related to interactive agents (chatbots) and recommendation generation, has recently seen substantial improvements – such as Amazon’s Alexa, and Google’s use of Word2Vec in their search product. Integration of this technology into student course selection is an innovative and interactive way for university students to retrieve information about available programs and courses. Further, we believe it will work for students to enhance the process of constructing their degree program with courses that both satisfy their degree and meet their interests. These goals can be condensed into three key benefits of the project outcome. 
1. Students will be able to obtain accurate information about courses they have not yet studied in a user friendly and simplified manner. The use of AI technology in user interaction will assist users in exploring the exact information that they need and reduce unnecessary time spent mining information. This largely reduces the difficulties of information exploration and reduces laborious and repetitive work.
2. AI course scheduling can operate as a digital assistant for students with their courses, which would conserve human resources for university departments. It could interact with students at any time without the use of an actual human advisor and would answer course-related questions quickly. 
3. We believe that this project will encourage students to explore more about courses and enable students to consider a greater number of options when enrolling. As a result, the proposed project would enhance student experience and university life.

## Technical and Other Constraints
Our primary limitations and technical constraints are (1) the quality or availability of our course and degree requirements data, (2) the quality of software which we can use for our interactive agent (chatbot) (3) the capabilities of the recommendation model that we create, which will depend on the AI technology that is available to us. *Note that some of the technologies and have not been completely committed to, and may change throughout the ideate and define phases (see schedule).*

### Course/degree requirements data
Data on course/degree requirements will allow our AI to provide accurate recommendations for courses based on prerequisites, required knowledge and degree program structures. There are two key options for accessing this data. The ideal situation is that we will be able to access the data on ISIS, where it is used in ANU’s administration software. We have undertaken steps to gain access to the ISIS database, and are awaiting approval to go ahead. If this is not possible, we have also discussed the possibility of web-scraping course data from the ANU “Programs and Courses” website.

ISIS data limitations:
-   The ISIS database may not contain all of the data that we require, in which case our AI could be limited to only recommending for certain programs and courses.
-   We may need to scrape additional data from the ANU Programs and Courses website.

Web-scraping limitations:
-   Some courses have complex requirements such as requiring one course from a certain group of courses, or that the student is in a particular year of their university studies. This may require us to encode complex rules and process the requirements with natural language processing technology. While our team has members experienced in NLP, the arbitrary complexity of these requirements could prove to be a major issue.

### Amazon Lex
Amazon Web Services’ customisable chatbot product “Amazon Lex” is being considered as an option for the creation of our chatbot. As it stands it is one of the better choices, especially given that some members of our team already have a good understanding of the documentation and capabilities of this product.

Key limitations:
-   Lex does not support integration with Google, Viber, Twitter or Skype. [[1]](#references)
-   Lex does not support explicit context switching. This means that once it perceives the user to have a certain intent, it will not change without being explicitly informed.
-   For the first year, Lex allows users to process up to 10,000 text requests and 5,000 speech requests per month for free. Following this first year, the pricing is $.00075 per text request. [[2]](#references)

Security:
-   Lex will store data from conversations automatically. Since the user identities are not matched with the conversations and AWS provides security, we do not believe that storing this data is a legitimate security risk.

Reliability:
-   Amazon Web Services has a great reputation for providing reliable products [[3]](#references). Amazon, being one of the largest organisations worldwide has AWS well protected from potential server failures.

### Recommendation model generation
Our model will require some form of recommendation algorithm, which is highly dependent on existing technology. Current Natural Language Processing techniques have found use in recommendation software, including advertising and search engine recommendations. However, they are still relatively limited in their effectiveness.

Limitations:
-   Many techniques still rely on models such as the TF-IDF transform, which do not preserve full meaning, as they do not preserve the order of the words in text.
-   More advanced models such as doc2vec often have issues with weighting too heavily on irrelevant parts of documents

Reliability:
-   We must ensure that there is an algorithmic recommendation option we can provide given that the AI model fails.
-   If both options fail often, the model will provide inaccurate and unreliable predictions.


## Resources, Risks and Potential Costs
**Risk** Chatbot technology is not at a sufficient standard to create a useful course selection AI.  
**How we will manage this risk:**
If the chatbot technology we use is not sufficient, we will likely move to a more structured question and answer session. Each user would only need to complete this question and answer session once, and the session would result in the creation of a profile for the user, which would store their degree program, interests and other personalised data.

**Risk** The ANU ISIS database is not made available for us to access course requirements.  
**How we will manage this risk:**
This was discussed above, however, it is important to note that if we are not able to access the ISIS data, we will need to assign an additional responsibility of creating a web scraper to one of our developers. This is relatively costly as the developer will therefore have substantially less time to contribute to other parts of our project, and the data gathered may be of a poorer quality.

**Potential cost: Amazon Web Services**  
Should we decide on using AWS’ Lex chatbot service, our best option would be to deploy our other required backend code on AWS as well. Aside from the aforementioned cost of Amazon Lex, deployment of our backend service and web page will also incur costs. AWS provides a free tier for the first year of use of its EC2 virtual machine product, which is a leading candidate for the deployment of our service.  
The ideal situation would be that the free tier of AWS Lex and EC2 would provide us with enough functionality to last through the testing and development phases. The finished product would then be handed on to the client, who would then pay any costs incurred from use of AWS.  
Exact costs for EC2 and AWS can be calculated when we have a more accurate understanding of the specifications of our virtual machine - that is, the required disk space, memory, CPU cores etc.

## NDA and IP Concerns
There will be no non-disclosure agreement required.

Any materials, tools, methods/techniques and software provided by Accenture and/or advised and agreed to be Accenture Copyright, will remain the intellectual property of Accenture. 

## References
 1. J. Singh. Google API.AI and Amazon Lex - A comparative review (2017).  
 https://www.linkedin.com/pulse/google-apiai-amazon-lex-comparative-review-jaskaran-singh/
 2. Amazon Lex Pricing.  
 https://aws.amazon.com/lex/pricing/
 3. B Darrow. Amazon Web Services tops list of most reliable public clouds. (2015)  
 https://gigaom.com/2015/01/07/amazon-web-services-tops-list-of-most-reliable-public-clouds/

