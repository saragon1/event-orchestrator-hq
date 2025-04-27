# Event Orchestrator HQ

An application for orchestrating events and managing attendees, built with React, TypeScript, and Supabase.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the main branch.

### Setting up GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to the "Pages" section
3. Set the "Source" to "GitHub Actions"
4. Push changes to the main branch to trigger deployment

### Manual Deployment

You can also manually trigger the deployment workflow:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"

## Container Deployment

This project includes Docker container support for easy deployment to any container platform.

### Using the Container

The container is automatically built and published to GitHub Container Registry (GHCR) when code is pushed to the main branch.

```bash
# Pull the latest container
docker pull ghcr.io/[owner]/event-orchestrator-hq:latest

# Run the container
docker run -p 8080:80 ghcr.io/[owner]/event-orchestrator-hq:latest
```

### Environment Variables

The container supports runtime environment variables for dynamic configuration:

```bash
# Example: Setting API URL at runtime
docker run -p 8080:80 -e VITE_API_URL=https://api.example.com ghcr.io/[owner]/event-orchestrator-hq:latest
```

### Building Locally

```bash
# Build the container
docker build -t event-orchestrator-hq .

# Run the container
docker run -p 8080:80 event-orchestrator-hq
```

## Continuous Integration

Pull requests to the main branch will automatically trigger a test workflow that:

1. Checks for linting errors
2. Performs TypeScript type checking
3. Ensures the project builds successfully

## Routing on GitHub Pages

This project uses client-side routing, which is supported on GitHub Pages through a custom 404 page redirect. This allows deep linking and browser refreshes to work correctly.

## Project info

**URL**: https://lovable.dev/projects/1bb8dfd5-78f2-4de6-af46-c8c70c4d44a0

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1bb8dfd5-78f2-4de6-af46-c8c70c4d44a0) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1bb8dfd5-78f2-4de6-af46-c8c70c4d44a0) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
