from setuptools import setup, find_packages

setup(
    name="backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.104.1",
        "uvicorn==0.24.0",
        "pydantic==2.4.2",
        "torch==2.1.1",
        "torch-geometric==2.4.0",
        "numpy==1.26.2",
        "pandas==2.1.3",
        "python-dotenv==1.0.0",
        "requests==2.31.0",
        "python-multipart==0.0.6",
        "aiohttp==3.9.1",
        "boto3==1.29.3",
        "python-jose==3.3.0",
        "passlib==1.7.4",
        "bcrypt==4.0.1"
    ],
) 