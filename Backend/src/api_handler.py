from src import API__connection__status__, __URL__, __URL_BASE__, get_stc, API_login
import requests
import json
from dotenv import load_dotenv
from spacetrack import SpaceTrackClient
import os

if API__connection__status__: #connection check
    print(f"[API HANDLER] Connection status: {API__connection__status__}. Proceeding with API handler operations.")

# ----- API DATA QUERIES -----
def get_all_active_SATCAT(limit=None):
    stc=get_stc()
    try:
        satcat_data = stc.satcat(decay="null-val", format="json", limit=limit, predicates=["NORAD_CAT_ID", "OBJECT_NAME", "OBJECT_TYPE", "COUNTRY", "RCS_SIZE", "LAUNCH"])

        if isinstance(satcat_data, str):
            satcat_data = json.loads(satcat_data)
        norad_ids = [item['NORAD_CAT_ID'] for item in satcat_data]

        tle_data = stc.tle_latest(norad_cat_id=norad_ids, format="json", limit=limit, predicates=["NORAD_CAT_ID", "PERIOD", "INCLINATION", "APOGEE", "PERIGEE"])

        if isinstance(tle_data, str):
            tle_data = json.loads(tle_data)

        latest_tle = {}
        for tle in tle_data:
            norad_id = tle['NORAD_CAT_ID']
            if norad_id not in latest_tle:
                latest_tle[norad_id] = tle

        tle_data = list(latest_tle.values())

        print(f"[API HANDLER] Retrieved SATCAT data. Number of records: {len(tle_data)}")
        return tle_data
    
    except Exception as e:
        print(f"[!API HANDLER ERROR!] Exception during SATCAT query: {e}")
        return None
    
#  type based queries
def get_satcat_type(limit=None, type_name="PAYLOAD"):
    stc=get_stc()
    type_name=type_name.upper()

    try:
        satcat_data = stc.satcat(object_type=type_name, decay = "null-val", format="json", limit=limit, predicates=["NORAD_CAT_ID", "OBJECT_NAME", "TYPE", "COUNTRY", "RCS_SIZE", "LAUNCH"])
        
        if isinstance(satcat_data, str):
            satcat_data = json.loads(satcat_data)
        norad_ids = [item['NORAD_CAT_ID'] for item in satcat_data]

        tle_data = stc.tle_latest(norad_cat_id=norad_ids, format="json", limit=limit, predicates=["NORAD_CAT_ID", "PERIOD", "INCLINATION", "APOGEE", "PERIGEE"])
        
        if isinstance(tle_data, str):
            tle_data = json.loads(tle_data)

        latest_tle = {}
        for tle in tle_data:
            norad_id = tle['NORAD_CAT_ID']
            if norad_id not in latest_tle:
                latest_tle[norad_id] = tle

        tle_data = list(latest_tle.values())
        
        print(f"[API HANDLER] Retrieved {type_name} SATCAT data. Number of records: {len(satcat_data)}")
        return tle_data
    except Exception as e:
        print(f"[!API HANDLER ERROR!] Exception during {type_name} SATCAT query: {e}")
        return None
    
