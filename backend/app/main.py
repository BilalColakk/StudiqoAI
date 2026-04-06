from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from .database import engine, Base
from . import models
from .routes import users, courses, exams, plans, availabilities

from .config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(users.router)
app.include_router(courses.router)
app.include_router(exams.router)
app.include_router(plans.router)
app.include_router(availabilities.router)


@app.get("/")
def home():
    return {"message": "Studiqo API running"}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Studiqo API",
        version="1.0.0",
        description="API for Studiqo",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi