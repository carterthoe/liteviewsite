import mysql.connector
import os

conn = None

# connect to SQL database
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv("SQL_HOST"),
            database=os.getenv("SQL_DATABASE"),
            user =os.getenv("SQL_USER"),
            password=os.getenv("SQL_PASSWORD")
        )
        print("[DB CLIENT] Successfully connected to the database.")
        return conn
    except mysql.connector.Error as err:
        print(f"[!DB CLIENT ERROR!] Error connecting to database: {err}")
        return None
    
def close_db_connection(conn):
    if conn is not None and conn.is_connected():
        conn.close()
        print("[DB CLIENT] Database connection closed.")