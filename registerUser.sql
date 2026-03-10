CREATE OR ALTER PROCEDURE sp_AddUser
    @UserID VARCHAR(8),
    @FullName VARCHAR(50),
    @Email VARCHAR(50),
    @Phone VARCHAR(12),
    @PasswordHash VARCHAR(60)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Users WHERE UserID = @UserID)
    BEGIN
        RETURN -1;
    END

    BEGIN TRY
        INSERT INTO Users (UserID, FullName, Email, Phone, PasswordHash)
        VALUES (@UserID, @FullName, @Email, @Phone, @PasswordHash);
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        RETURN -1; 
    END CATCH
END
GO
