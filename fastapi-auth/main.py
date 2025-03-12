from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import auth

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")

@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Auth"}

@app.get("/protected")
async def protected_route(token: str = Depends(auth.oauth2_scheme)):
    """A protected route requiring a valid JWT"""
    user = auth.verify_jwt(token)
    return {"message": f"Hello {user['email']}, you are authenticated!"}
