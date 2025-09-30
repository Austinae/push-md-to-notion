---
notion_page: https://www.notion.so/README-md-271363c88bf1804691cfd5b057c255d0
title: testing this please work
---

**Welcome to Merciv's EVA!!!**

This README aims to provide a general overview to help you get started developing our microservices application.

More docs can be found in:
- README/Makefile in this codebase for each respective service
- [Notion](https://www.notion.so/Merciv-HQ-1d7363c88bf180dd925cdb6a105b7a73?pvs=4)
- [Google Drive](https://drive.google.com/drive/u/1/folders/0AIrt3DFFotrfUk9PVA)

# Application Architecture

EVA's core components:

<img width="2445" height="1581" alt="mermaid-diagram-2025-09-25-142836" src="https://github.com/user-attachments/assets/29d23957-f260-44c5-9e90-264f5a0a7c10" />

# QuickStart for Local Dev

## Database

Datacore, Chat & Doc Process microservices each have their own dedicated Postgres database. In production, these databases are separate instances; locally, they're different databases within the one Postgres instance. 

Download Postgres to [get started](https://postgresapp.com/downloads.html).

We use `sqlboiler` as our ORM. Install with `brew install sqlboiler`.

## Auth

For authentication, we use (Auth0)[https://auth0.com/].

For authorization, we handle our own Role-based Access Control. A few tables are dedicated to this, including but not limited to `roles`, `permissions`, and `role-permissions`.

## Observability

We use [New Relic](https://newrelic.com/) for observability, including events and logs.

## Feature Flags

We use [PostHog](https://posthog.com/) for feature flags. Hot reloading of feature flags is possible for frontend clients using [`scripts/refetch-ffs.sh`](./scripts/refetch-ffs.sh). If it's not already done, please ask around to be added to our workspace.

## AWS

We use [AWS](https://aws.amazon.com/) for hosting for our services. [Click here](https://d-9067e79266.awsapps.com/start/#/?tab=accounts) to access the AWS Merciv web portal.

Click [here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) to learn how to install the AWS CLI.

Afterwards, follow [this](https://github.com/user-attachments/files/22539712/Merciv.-.How.to.Install.and.Connect.to.AWS.Client.VPN.pdf) guide to get setup with our VPN.

Follow the [AWS Client VPN setup](https://github.com/Merciv-Dev/EVA/blob/main/devops/README.md#how-to-connect-to-aws-client-vpn) and steps 1-2 from the [EKS cluster configuration](https://github.com/Merciv-Dev/EVA/blob/main/devops/README.md#how-to-setup-aws-cli-configuration-to-access-eks-cluster) in the [DevOps README](./devops/README.md).

## Golang

We use Golang for most core business needs. It is used in our `datacore` & `api-gateway` services.

Install the latest version of Go from [here](go.dev/dl). Then, we recommend to use `gvm` to manage Go versions. [Click here](https://github.com/moovweb/gvm) to install `gvm`. See `go.work` for our current version.

Afterwards, be sure to install datacore dependency tools by running this within `go/cmd/datacore`:

```
make dep-tools
```

Install the dependency required to run Go linting:

```
make install-lint
```

## Python

We currently use Python `3.10` for most of our development. To manage multiple python versions cleanly, it is recommended to use virtual environments via `pyenv`. [Install & learn to use pyenv here](https://github.com/pyenv/pyenv).

Install `pyenv-virtualenv` to run the following commands (`brew install pyenv-virtualenv` on Mac):

```
pyenv virtualenv 3.10 eva
```

```
pyenv activate eva
```

### Automatic Virtual Env

To automatically activate the eva virtual environment when CD'ing into the directory, add `eval "$(pyenv virtualenv-init -)` to your `~/.bashrc` or `~/.zshrc`. This links the `.python-version` file to pyenv. Essentially after CD'ing into a new directory pyenv will look for a `.python-version`. If one exists, it will use to run `pyenv activate` internally.

### Poetry

We use `poetry` for dependency management within our Python applications. Once you have installed Python, you will also need to install poetry via `pip`:

```
pip install poetry
```

Afterwards, you should be able to install all the Python dependencies in a single command:

```
cd python && make dep
```

Under the hood, this runs `poetry install` in all the Python targets.

## Java

To run `make gen` successfully, `openapi_generator` requires Java.

Install Java on Mac:

```
brew install openjdk
sudo ln -sfn $(brew --prefix)/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk
export JAVA_HOME="/Library/Java/JavaVirtualMachines/openjdk.jdk/Contents/Home"
java --version
```

Be sure to add that export to your shell config as well.

## JavaScript

We use Node `20.11.0`. We recommend using `nvm` to install and manage `node` and `npm` versions. [Click here](https://github.com/nvm-sh/nvm) to install `nvm`.

We use Yarn `1.22.21` to manage a JavaScript monorepo within the `js` directory. Run `brew install yarn` on mac.

## Docker

To spin up our services locally, we use Docker.

Install Docker [here](https://www.docker.com/get-started/). These containers require the right environment variables to work as expected. We use a script named [`scripts/generate-env.sh`](./scripts/generate-env.sh) to pull these secrets from 1Password and AWS to build an `.env.docker` file which is used at build time for local dev. This script depends on jq. If not on your system already, install jq [here](https://jqlang.org/download/) here.

## 1Password Developer Setup

Install 1Password [here](https://1password.com/downloads/mac). Then follow [1Password CLI tutorial](https://developer.1password.com/docs/cli/get-started/#step-1-install-1password-cli).

To confirm it's working You should be able to run `op vault list` and expect to see a list of the vaults you have access to.

## Serialization

Protobuf is used for data serialization, ensuring consistency across our services and speeds up CRUD workflows. 

Install by running `make install-buf`. You might have to run with sudo.

## Application Dependencies

To install application dependencies, run `make dep` from the project root.

Note that this will install Protobuf dependencies as well. If you've installed Go directly (not with `gvm`), this will require you to first add the following to your shell config (`.bashrc`, `.zshrc`, etc.):

```
export PATH="$PATH:$(go env GOPATH)/bin"
```

If you're using Go workspaces, you will need to run `go work vendor` once `make dep` fails on Go vendoring.

If necessary, uninstall with:

```
make uninstall-buf
```

# Start the Application

Once you have completed the prerequisites above, spin up your local environment:

```bash
make up
```

This uses Docker Compose to build our containers & run our app locally. The `make up` command will automatically generate the required `.env.docker` file using secrets from 1Password and AWS credentials.

Good job 🎉 - You should now be up and running for local dev!

To open the web UI in your browser, visit [http://localhost:5173/](http://localhost:5173/). You can see this port and other local service container info via `docker ps`.

## Local vs Prod Deployment & Secrets

There are two different docker compose configs for local dev: `docker-compose.yml` for hot-reloading and `docker-compose.prod.yml` for an exact mirror of production. Neither of these is used in production or for production builds, so note that any plaintext secrets in those configs are strictly for local dev.

We run EVA in production on AWS via [Amazon EKS (Elastic Kubernetes Service)](https://aws.amazon.com/eks/). The CI process is handled via GitHub Actions, while the CD process is managed using [Flux](https://fluxcd.io/). Our entire infrastructure is written with Terraform/Terragrunt. Prod secrets are managed in AWS Secrets Manager and supplied via Terraform to the Kubernetes pods that the containers run in.

# Start Specific Services

Sometimes, you may want to run only a specific microservice. Note that this will also start its dependencies as needed. For example:

```
make up app=datacore
```

# Run tasks

In order to run tasks, it can be run multiple times using docker compose:

```
docker exec -it $(docker compose ps -q tasks) /usr/src/app/cmd/tasks/bin/tasks process_failed_document_pages
docker exec -it $(docker compose -f ./docker-compose.prod.yml ps -q tasks) /usr/src/app/cmd/tasks/bin/tasks process_failed_document_pages
```

# Local Logging

View logs of all local apps:

```
make log
```

View logs of a specific service:

```
make log app=chat
```

# Restarting Local Apps

Restart everything:

```
make restart
```

Restart specific app:

```
make restart app=datacore
```

Restart multiple specific apps:

```
docker compose restart datacore chat
```

# Backend Dev

## API

We generate our API from Protocol Buffers using the `buf` CLI tool.

Our UI client uses this API via HTTP to communicate with API Gateway, with certain connections are upgraded to WebSockets. API Gateway and our other services use this API via gRPC to communicate.

Our data models live in `EVA/go/cmd/datacore/internal/`. Our API is designed as a "clean architecture": gRPC Request → Handler → Service → Repository → Database. [Learn more & see an example](https://app.clickup.com/9014323703/v/dc/8cmqafq-2414/8cmqafq-2034).

To make API changes, modify `chat.proto`.

To generate API boilerplate and Go mocks, run:

```
make gen
```

You can view the API via the generated OpenAPI/Swagger file:

```
npx open-swagger-ui --open protobuf/chat-data/openapiv2/chat-data.swagger.json
```

### TypeScript Field Optionality

The generated TypeScript HTTP client automatically aligns field optionality with protobuf definitions:

- **Non-optional proto fields** → **Required TypeScript properties** (no `?`)
- **`optional` proto fields** → **Optional TypeScript properties** (with `?`)

This post-processing runs automatically during `make gen` and ensures TypeScript types accurately reflect the protobuf contract. See the [post-processing script](js/lib/chat-data-http-client/scripts/fix-required-fields.js) for implementation details.

For debugging, run with verbose output:

```
node js/lib/chat-data-http-client/scripts/fix-required-fields.js --debug
```

## Visualization Schema Generation

The application uses JSON schemas located in the `schemas/` directory to define the structure for visualization candidates extracted from text. Specifically:

- `schemas/visualization_candidate.json`: Defines the final, enriched structure stored in the database and used by services after processing.
- `schemas/visualization_candidate_core.json`: Defines the core data structure embedded within the main candidate schema.

A Python script (`scripts/generate_visualization_types_from_schema.py`) uses these schemas to automatically generate:

- Pydantic models for Python (`python/cmd/chat-core/src/orchestrator/extract_viz/models_generated.py`)
- Go structs (`go/cmd/datacore/internal/visualizations/types/visualization_candidate_generated.go`)
- TypeScript types (`js/cmd/ui/src/types/visualization_generated.ts`)
- A specific JSON schema for LLM interaction (`python/cmd/chat-core/src/orchestrator/extract_viz/schema_generated.json`)

To run only the visualization schema generation, use:

```bash
make gen-schemas
```

This command is also included as part of the main `make gen` command.

## Database & Migrations

We use Goose for database migrations and SQLBoiler for generating our Go ORM boilerplate.

See the [Datacore README](./go/cmd/datacore/README.md) for more details on its structure and testing.

Install these with commands in the Makefile in `EVA/go/cmd/datacore`.

To create a new migration file for main DB, run:

```
make goose-create name=<migration_name>
```

To create a new migration file for LLM DB, run:

```
make goose-create-llm name=<migration_name>
```

To run a migration:

```
make migrate
```

## Message Queue

We use RabbitMQ as a message queue to coordinate async events between services in our app.

To monitor the message queue, visit the RabbitMQ administrator page in the respective environment. In local dev, this should be http://0.0.0.0:15672/, with credentials in our docker compose file. You can publish events there or via HTTP.

# Testing & Debugging

We have a number of tests throughout our repo. They run during CI via GitHub Actions. They can be run locally via local GitHub Actions, via global and service-specific `make` commands, or directly.

We don't aim for 100% coverage currently; add them judiciously.

Specific services often have more detailed README files. For example:

- The **chat-core** service README ([python/cmd/chat-core/README.md](./python/cmd/chat-core/README.md)) contains setup instructions and links to further documentation for its components, such as detailed testing procedures for the [visualization extraction module](./python/cmd/chat-core/src/orchestrator/extract_viz/README.md).
- The **datacore** service README ([go/cmd/datacore/README.md](./go/cmd/datacore/README.md)) provides details on database migrations and testing.

# Coding Conventions

[See our current conventions](https://www.notion.so/Conventions-for-Branch-Names-Commit-Messages-and-Pull-Requests-1ed363c88bf18022a762d72647f2e6d4?pvs=4) for commit messages, branch names, and PRs.

# Updating the Docs

Please update our docs wherever you see room for improvement or wherever information has become stale.
