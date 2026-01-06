# Nectar Hub DApp (PHP Backend Version)

This project is a web application with a PHP backend that interacts with a MySQL database. It's designed to be deployed on a cPanel hosting environment.

## Deployment Instructions

Follow these steps to deploy the application on your cPanel server.

### 1. Upload Files

Upload all the project files (`index.html`, `app.js`, `schema.sql`, and the `assets` and `api` directories) to the `public_html` directory (or your desired subdomain's root directory) on your cPanel server.

### 2. Database Setup

You need to create a MySQL database and import the table structure using the provided `schema.sql` file.

1.  **Log in to cPanel.**
2.  Navigate to the **MySQL® Databases** tool.
3.  **Create a New Database**: Enter a name for your database and click "Create Database".
4.  **Create a New User**: Scroll down to "MySQL Users", create a new user with a strong password, and click "Create User".
5.  **Add User to Database**: Scroll down to "Add User To Database", select the user and the database you just created, and click "Add".
6.  **Assign Privileges**: On the next screen, check the "ALL PRIVILEGES" box and click "Make Changes".
7.  **Import the Schema**:
    *   Go back to the cPanel main page and open **phpMyAdmin**.
    *   Select your newly created database from the left-hand sidebar.
    *   Click on the **Import** tab at the top.
    *   Click "Choose File" and select the `schema.sql` file from your local machine (or from the server if you uploaded it).
    *   Click "Go" at the bottom of the page. The `users` and `transactions` tables should now be created in your database.

### 3. Configure the Backend

The final step is to update the database configuration file with the credentials you just created.

1.  In the cPanel File Manager, navigate to the `api` directory.
2.  Right-click on the `db_config.php` file and select "Edit".
3.  Update the following lines with your actual database details:

    ```php
    define('DB_HOST', 'localhost'); // Usually 'localhost' on cPanel
    define('DB_USERNAME', 'your_cpanel_username_and_db_user'); // e.g., 'cpaneluser_dbuser'
    define('DB_PASSWORD', 'your_db_password');
    define('DB_NAME', 'your_cpanel_username_and_db_name'); // e.g., 'cpaneluser_dbname'
    ```
4.  Save the changes.

Your application should now be live and connected to the database.
