## Week 4 Client meeting minutes

Present

* Team: All 6 members  
* Clients: Emily, Saf, Niranjan and Bradley

Updates:

* Audit complete; presentation went well
* Service deployed

--
### Client feedback on website

* Should we have a different home page that checks if a user is a postgrad or is doing a double degree? 
	* Unresolved for postgrad, use a checkbox to see if the user is doing a second degree
* Have a drop down menu for year of start. Have it range in whatever years ANU captures data.
* Change "start" on the homepage to "start(ed)" so that users know they can add past years as their start year.
* Chatbox: Do we need the "x" button? Should we have a minimise button?
 	* Consensus: Change the x to a down arrow to minimise. Once minismised, change it to an up arrow
* Colour coded: major, minor and compulsory courses. 
* Degrees (such as the Arts degrees) which have a lot of freedom: should they be left blank? 
	* Consensus: Yes. And capture the degree rules on the right sidebar
* Add the ability to drag and drop courses across semesters
* Add a link to ANU's suggested study plan?
* Add warning when the user tries to add more than 2 minors or 2 majors because ANU does not allow that
* Double degrees: Since all combos are not allowed, query ANU's options to see if it viable? Need a validation decision tree for it.
* Requested feature: Auto add a course to the degree based on some rules.
* Try to learn a latent objective such as "graduate early" or "learning in a particular area" and recommend based on that
* Support part-time and overloading
* What can we do when the titles/codes change across years? Any way we can capture that they are the same course?
	* Don't worry about this at the current moment. Has to do with continuous integration. 
* Future courses run in next year but it says on the page that the course does not exist. When a user tries to add a course that is not offered in that year, colour the semesters in red. 
	* Same as  above 
* build user base: ANU adminstrators, students, staff
* The data model can be modelled as a graph database. Take a look at GraphIQL for a UI.
* If you want more attraction: contact ANUSA and PARSA
* What do students want to export as an degree plan PDF?
	* To be discussed 
* Instead of a user name and password, maybe generate a code. Add it to the PDF they export so that they can sig in with the code. A code is needed anyway for cookie storage
* Logging in with ISIS?
	* Unimportant right now. Has to do with continuous integration
* Create Trello cards so that our work is more visible to the tutor. If possible, look into whether points can be associated to Trello cards. Also create user stories wherever possible.
* Do some testing soon so clients can give us feedback. Inform testers of the degrees available before carrying it out
*  Need to get all the degrees covered into the system. 
	*  A deadline for it? Before mass testing. 
	*  Do we automate it? Yes. But given the variety in the different degree rules, and the inconsistencies with scraping the data, we may have to fix some stuff manually.

