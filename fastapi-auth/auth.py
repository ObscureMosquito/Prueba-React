import os
import jwt
import time
from jwt import PyJWKClient
import requests
import boto3
import json
import hmac
import hashlib
import base64
from urllib.request import urlopen
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

AWS_REGION = os.getenv("AWS_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")
COGNITO_CLIENT_SECRET = os.getenv("COGNITO_CLIENT_SECRET")
COGNITO_JWKS_URL = f"https://cognito-idp.{AWS_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"

client = boto3.client("cognito-idp", region_name=AWS_REGION)

resend_timestamps = {}

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class VerifyUserRequest(BaseModel):
    email: str
    code: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ResendCodeRequest(BaseModel):
    email: str

@router.post("/refresh")
def refresh_token(request: RefreshTokenRequest):
    """Refresh JWT token using Cognito"""
    try:
        response = client.initiate_auth(
            AuthFlow="REFRESH_TOKEN_AUTH",
            AuthParameters={"REFRESH_TOKEN": request.refresh_token},
            ClientId=COGNITO_CLIENT_ID
        )

        return {
            "id_token": response["AuthenticationResult"]["IdToken"],
            "access_token": response["AuthenticationResult"]["AccessToken"],
        }
    except Exception as e:
        print("❌ Token refresh failed:", str(e))
        raise HTTPException(status_code=401, detail="Token refresh failed")
        
def calculate_secret_hash(username: str):
    """Calculate the AWS Cognito secret hash"""
    message = username + COGNITO_CLIENT_ID
    dig = hmac.new(COGNITO_CLIENT_SECRET.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(dig).decode()

def verify_jwt(token: str):
    """Verify JWT Token using Cognito Public Keys"""
    try:
        jwk_client = PyJWKClient(COGNITO_JWKS_URL)
        signing_key = jwk_client.get_signing_key_from_jwt(token).key

        decoded = jwt.decode(token, signing_key, algorithms=["RS256"], audience=COGNITO_CLIENT_ID)

        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
def login(request: LoginRequest):
    """Authenticate user and return JWT token"""
    try:
        print(f"Attempting login for {request.email}")

        secret_hash = calculate_secret_hash(request.email)

        response = client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={
                "USERNAME": request.email,
                "PASSWORD": request.password,
                "SECRET_HASH": secret_hash
            },
            ClientId=COGNITO_CLIENT_ID
        )

        print("Login successful:", response["AuthenticationResult"])
        return {
            "id_token": response["AuthenticationResult"]["IdToken"],
            "access_token": response["AuthenticationResult"]["AccessToken"],
            "refresh_token": response["AuthenticationResult"]["RefreshToken"]
        }
    except client.exceptions.NotAuthorizedException:
        print("❌ NotAuthorizedException: Invalid credentials")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    except client.exceptions.UserNotFoundException:
        print("❌ UserNotFoundException: User does not exist")
        raise HTTPException(status_code=404, detail="User not found")
    except client.exceptions.UserNotConfirmedException:
        print("❌ UserNotConfirmedException: User is not verified")
        raise HTTPException(status_code=403, detail="User not verified")
    except Exception as e:
        print("❌ Unknown error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/register")
def register(request: RegisterRequest):
    """Register a new user in Cognito"""
    try:
        secret_hash = calculate_secret_hash(request.email)

        response = client.sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=request.email,
            Password=request.password,
            SecretHash=secret_hash,
            UserAttributes=[
                {"Name": "email", "Value": request.email},
                {"Name": "name", "Value": request.name}
            ]
        )

        return {"message": "User registered successfully. Please check your email for the verification code."}

    except client.exceptions.UsernameExistsException:
        raise HTTPException(status_code=400, detail="User already exists")
    except client.exceptions.InvalidPasswordException:
        raise HTTPException(status_code=400, detail="Password does not meet complexity requirements")
    except Exception as e:
        print("❌ Registration error:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/verify")
def verify_user(request: VerifyUserRequest):
    """Confirm a new user using the AWS Cognito verification code"""
    try:
        secret_hash = calculate_secret_hash(request.email)

        response = client.confirm_sign_up(
            ClientId=COGNITO_CLIENT_ID,
            Username=request.email,
            ConfirmationCode=request.code,
            SecretHash=secret_hash
        )

        return {"message": "User verified successfully. You can now log in."}

    except client.exceptions.CodeMismatchException:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    except client.exceptions.ExpiredCodeException:
        raise HTTPException(status_code=400, detail="Verification code expired")
    except client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=404, detail="User not found")
    except client.exceptions.NotAuthorizedException:
        print("❌ NotAuthorizedException: Ensure AWS credentials and permissions are correct.")
        raise HTTPException(status_code=403, detail="Verification failed. Please contact support.")
    except Exception as e:
        print(f"❌ Unexpected error during verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
@router.post("/resend-code")
def resend_verification_code(request: ResendCodeRequest):
    """Resend verification code to user's email with rate limiting"""
    global resend_timestamps
    email = request.email

    secret_hash = calculate_secret_hash(request.email)

    current_time = time.time()
    if email in resend_timestamps:
        time_since_last_request = current_time - resend_timestamps[email]
        if time_since_last_request < 60:
            remaining_time = int(60 - time_since_last_request)
            raise HTTPException(status_code=429, detail=f"Please wait {remaining_time}s before resending the code.")

    try:
        client.resend_confirmation_code(
            SecretHash=secret_hash,
            ClientId=COGNITO_CLIENT_ID,
            Username=email
        )

        resend_timestamps[email] = current_time

        return {"message": "Verification code resent successfully. Check your email."}
    
    except client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=404, detail="User not found.")
    
    except client.exceptions.UserNotConfirmedException:
        return {"message": "A new verification code has been sent to your email."}
    
    except client.exceptions.LimitExceededException:
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")

    except Exception as e:
        print(f"❌ Error resending verification code: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while resending the verification code.")
    
@router.get("/me")
def get_current_user(token: str = Depends(oauth2_scheme)):
    """Fetch user info from Cognito"""
    user_data = verify_jwt(token)
    return {"email": user_data["email"], "roles": user_data.get("cognito:groups", [])}
