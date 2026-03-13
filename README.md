# academic-class-coordination
A full-stack Academic Subject Management System built with Node.js, Express and MS SQL Server

Features:
1. User Authentication: Secure registration and login system, using bcrypt for password hasing and express-session for session persistence.
2. Relational Database: The reliable MS SQL Server keeps four tables interconnected: Users, Subjects, Applications and Materials.
3. File Management: The capability to upload and download materials for each subject using Multer, with unique filenames and a well-structured directory system for every subject.
4. Interactive UI: Responsive frontend built with EJS + CSS, featuring asynchronous subject detail loading and file deletion, without the requirement of page refresh.

Built with:
1. Backend: Node.js + Express
2. Frontend: EJS templates + CSS + client side JavaScript
3. Database: MS SQL Server (mssql package)

How to use it:
(Firstly, make sure you have Node.js installed on your machine and MS SQL Server is running locally)
1. Clone the repo: git clone https://github.com/SzabolcsKun/academic-class-coordination
2. Database setup:
   1. Database initialization: Execute database_structure.sql to create WebProg database and necesarry tables
   2. Registration logic: Execute registerUser.sql
   3. Configuration: Ensure the credentials in database.js match your local environment
3. Install the required dependencies: npm install
4. Start the server: node server.js
5. Connect to the server (open in any browser): http://localhost:8080/
