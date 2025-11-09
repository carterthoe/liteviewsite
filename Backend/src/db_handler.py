import db_client as dbc

conn = dbc.get_db_connection()

def connect_db():
    dbc.get_db_connection()

def close_db():
    dbc.close_db_connection(conn)

def get_all_satcat_data():
    if conn is None:
        print("[DB HANDLER] No database connection available.")
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM satcat_data"
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"[DB HANDLER] Retrieved {len(results)} records from satcat_data table.")
        return results
    except Exception as e:
        print(f"[!DB HANDLER ERROR!] Exception during data retrieval: {e}")
        return None
    finally:
        cursor.close()

def get_all_tle_data():
    if conn is None:
        print("[DB HANDLER] No database connection available.")
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM tle_data"
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"[DB HANDLER] Retrieved {len(results)} records from tle_data table.")
        return results
    except Exception as e:
        print(f"[!DB HANDLER ERROR!] Exception during data retrieval: {e}")
        return None
    finally:
        cursor.close()

def insert_satcat_data(satcat_records):
    if conn is None:
        print("[DB HANDLER] No database connection available.")
        return False
    
    try:
        cursor = conn.cursor()
        insert_query = """
            INSERT INTO satcat_data (NORAD_CAT_ID, OBJECT_NAME, OBJECT_TYPE, COUNTRY, RCS_SIZE, LAUNCH)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                OBJECT_NAME=VALUES(OBJECT_NAME),
                OBJECT_TYPE=VALUES(OBJECT_TYPE),
                COUNTRY=VALUES(COUNTRY),
                RCS_SIZE=VALUES(RCS_SIZE),
                LAUNCH=VALUES(LAUNCH)
        """
        for record in satcat_records:
            data_tuple = (
                record['NORAD_CAT_ID'],
                record['OBJECT_NAME'],
                record['OBJECT_TYPE'],
                record['COUNTRY'],
                record['RCS_SIZE'],
                record['LAUNCH']
            )
            cursor.execute(insert_query, data_tuple)
        
        conn.commit()
        print(f"[DB HANDLER] Inserted/Updated {cursor.rowcount} records into satcat_data table.")
        return True
    except Exception as e:
        print(f"[!DB HANDLER ERROR!] Exception during data insertion: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def insert_tle_data(tle_records):
    if conn is None:
        print("[DB HANDLER] No database connection available.")
        return False
    
    try:
        cursor = conn.cursor()
        insert_query = """
            INSERT INTO tle_data (NORAD_CAT_ID, PERIOD, INCLINATION, APOGEE, PERIGEE)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                PERIOD=VALUES(PERIOD),
                INCLINATION=VALUES(INCLINATION),
                APOGEE=VALUES(APOGEE),
                PERIGEE=VALUES(PERIGEE)
        """
        for record in tle_records:
            data_tuple = ((
                int(record['NORAD_CAT_ID']),
                float(record['PERIOD']),
                float(record['INCLINATION']),
                float(record['APOGEE']),
                float(record['PERIGEE'])
            ))

        cursor.executemany(insert_query, data_tuple)
        conn.commit()
        print(f"[DB HANDLER] Inserted/Updated {cursor.rowcount} records into tle_data table.")
        return True
    except Exception as e:
        print(f"[!DB HANDLER ERROR!] Exception during data insertion: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def prune_decayed():
    if conn is None:
        print("[DB HANDLER] No database connection available.")
        return False
    
    try:
        cursor = conn.cursor()

        # Delete satcat_data entries whose NORAD_CAT_ID does not exist in tle_data
        delete_query = """
            DELETE FROM satcat_data
            WHERE NORAD_CAT_ID NOT IN (SELECT NORAD_CAT_ID FROM tle_data)
        """
        cursor.execute(delete_query)
        deleted_count = cursor.rowcount

        conn.commit()
        print(f"[DB HANDLER] Pruned {deleted_count} decayed records from satcat_data.")
        return True

    except Exception as e:
        print(f"[!DB HANDLER ERROR!] Exception during pruning: {e}")
        conn.rollback()
        return False

    finally:
        cursor.close()
