USE master
GO

--CREATE LOGIN Szabi WITH PASSWORD = 'ksim2463'
--GO

--CREATE DATABASE WebProg
--GO

--USE WebProg
--GO

--CREATE USER Szabi FOR LOGIN Szabi
--GRANT insert, update, delete, connect, execute select TO Szabi
--GO

USE WebProg
GO

DROP TABLE IF EXISTS Materials
DROP TABLE IF EXISTS Applications
DROP TABLE IF EXISTS Subjects
DROP TABLE IF EXISTS Users

CREATE TABLE Users (
	UserID VARCHAR(8) UNIQUE,
	FullName VARCHAR(50),
	Email VARCHAR(50) UNIQUE,
	Phone VARCHAR(12) UNIQUE,
	PasswordHash VARCHAR(60),
	CONSTRAINT PK_Users PRIMARY KEY (UserID)
)

CREATE TABLE Subjects (
	SubjectID VARCHAR(20) UNIQUE,
	SubjectName VARCHAR(50),
	SubjectGrade VARCHAR(20),
	KurzusNr INT,
	SzemiNr INT,
	LaborNr INT,
	OwnerID VARCHAR(8),
	CONSTRAINT PK_Subjects PRIMARY KEY (SubjectID),
	CONSTRAINT FK_Subjects_Users FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
)

CREATE TABLE Applications (
	ApplicationID INT IDENTITY,
	SubjectID VARCHAR(20) NOT NULL,
	UserID VARCHAR(8) NOT NULL,
	CONSTRAINT FK_Subjects_Applications FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID),
	CONSTRAINT FK_Users_Applications FOREIGN KEY (UserID) REFERENCES Users(UserID),
	CONSTRAINT PK_Applications PRIMARY KEY (ApplicationID)
)

CREATE TABLE Materials (
	MaterialID INT IDENTITY,
	SubjectID VARCHAR(20) NOT NULL,
	MaterialName VARCHAR(150) NOT NULL UNIQUE,
	RelativePath VARCHAR(250) NOT NULL,
	Size INT,
	UploadDate DATETIME DEFAULT GETDATE(),
	CONSTRAINT FK_Subjects_Materials FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID),
	CONSTRAINT PK_Materials PRIMARY KEY (MaterialID)
)
