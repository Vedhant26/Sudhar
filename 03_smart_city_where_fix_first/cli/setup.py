from setuptools import setup, find_packages

setup(
    name="Sudhar",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "typer>=0.9.0",
        "rich>=13.7.0",
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "requests>=2.31.0",
    ],
    entry_points={
        "console_scripts": [
            "Sudhar=Sudhar.main:app",
        ],
    },
)
