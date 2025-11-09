import requests
from dotenv import load_dotenv
from spacetrack import SpaceTrackClient
import os

__URL_BASE__ = "https://www.space-track.org/"
REQUEST_CONTROLLER_ACTION = "basicspacedata/query/class/"

__URL__ = __URL_BASE__ + REQUEST_CONTROLLER_ACTION

def API_connection_test(URL):
    print(f"[API CLIENT] Testing connection to {URL}")
    try:
        response = requests.get(URL)
        if response.status_code == 200:
            print("[API CLIENT] Connection test successful.")
            return True
        else:
            print(f"[!API CLIENT ERROR!] Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"[!API CLIENT ERROR!] Exception during connection test: {e}")
        return False
    
def query_check():
    response = requests.get(__URL__)
    if response.status_code == 200:
        print(f"[API CLIENT] Data query successful.")
        return 200
    if response.status_code == 204:
        print(f"[API CLIENT] Data query returned no content.")
        return 204
    if response.status_code == 400:
        print(f"[!API CLIENT ERROR!] Data query bad request.")
        return 400
    if response.status_code == 500:
        print(f"[!API CLIENT ERROR!] Data query server error.")
        return 500
    
# ----- SPACE TRACK SESSION LOG IN -----

stc_session = None # Global session variable

def API_login():
    login_url = __URL_BASE__ + "ajaxauth/login"
    response = requests.get(login_url)

    load_dotenv()

    username = os.getenv("SPACE_TRACK_USER")
    password = os.getenv("SPACE_TRACK_PASS")
    if not username or not password:
        print("[!API HANDLER ERROR!] Missing Space-Track credentials in .env file.")
        return None
    
    global stc_session

    if stc_session is not None:
        print("[API CLIENT] Already logged in.")
        return stc_session

    try:    
        stc_session = SpaceTrackClient(identity=username, password=password)
        stc_session.tle_latest(limit=1, format="json")
        print(f"[API CLIENT] Logged into Space-Track.org as user: {username}")
        return stc_session

    except Exception as e:
        print(f"[!API CLIENT ERROR!] Exception during API login: {e}")
        return None

def get_stc():
    global stc_session
    if stc_session is None:
        stc_session = API_login()
    return stc_session