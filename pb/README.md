# PocketBase Production Data

This folder contains production PocketBase data that will be deployed with the application.

## Purpose

- **Production Data Only**: Files in this directory are intended for production use and will be included in deployments.
- **Version Controlled**: This directory is tracked in the repository, so any data stored here will be saved in version control.

## Development vs. Production

- For development purposes, use the `../pocket_base` directory instead, which is excluded from the repository.
- Development data in `../pocket_base` will not be committed to version control or deployed.

## Usage

- Place migrations, schema definitions, and initial data that should be available in production.
- Avoid storing sensitive data or large binary files in this directory.
- Use the command `yarn pb:sync` to synchronize changes between development and production environments when needed.
- Use `yarn pb:snapshot` to create a migration snapshot of the current PocketBase configuration.

## Deployment Notes

When deploying the application, PocketBase will use the data and migrations from this directory to initialize or update the database structure.
