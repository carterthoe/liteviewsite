import src
from src import api_handler as API
from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
async def root():
    #return{"Hello": "World"}
    src.API_login()
    return{"Connected?": src.API__connection__status__}

# ----- API ENDPOINTS -----
@app.get("/satcat")
async def get_satcat_data(limit: int = 10): # limit for testing
    if not src.API__connection__status__:
        return {"error": "API connection is not active."}
    
    satcat_data = API.get_all_active_SATCAT(limit=limit)
    if satcat_data is None:
        return {"error": "Failed to retrieve SATCAT data."}
    
    return {"satcat_data": satcat_data}

@app.get("/satcat/{type_name}")
async def get_satcat_by_type(type_name: str, limit: int = 100):
    if not src.API__connection__status__:
        return {"error": "API connection is not active."}
    
    match type_name.upper():
        case "PAYLOAD":
            satcat_data = API.get_satcat_type(limit=limit, type_name="PAYLOAD")
        case "ROCKET BODY":
            satcat_data = API.get_satcat_type(limit=limit, type_name="ROCKET BODY")
        case "DEBRIS":
            satcat_data = API.get_satcat_type(limit=limit, type_name="DEBRIS")
        case _:
            return {"error": "Invalid type name. Use 'PAYLOAD', 'ROCKET BODY', or 'DEBRIS'."}
        
    if satcat_data is None:
        return {"error": f"Failed to retrieve SATCAT data for type: {type_name}."}
    
    return {"satcat_data": satcat_data}
    
    

if __name__ == "__main__":
    print("[MAIN] Starting backend main execution.")