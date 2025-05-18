# ReqFlowly - LLM-Powered Requirements Engineering Tool

[![React](https://img.shields.io/badge/React-19.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-green)](https://vitejs.dev/)

ReqFlowly is a web-based application that automates the analysis of software requirements using artificial intelligence together with rule-based heuristics. It assists users with the identification of key domain entities and with the generation of use cases and test cases, significantly reducing manual effort and improving the accuracy of requirements.

### [->Link to deployed application<-](https://reqflowly.up.railway.app/)

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Project Structure](#-project-structure)

## ✨ Features

The ReqFlowly frontend provides the following key features:

- **User Authentication**: Secure login and registration with Firebase Authentication (email/password and Google sign-in).
- **Project Management**: Create, view, and manage requirements engineering projects.
- **Requirements Management**: Upload and process requirements from both text and PDF documents.
- **Domain Entity Visualization**: View and manage automatically extracted domain entities and their attributes.
- **Use Case Management**: Generate, view, and edit use case specifications.
- **Test Case Management**: Generate, view, and edit test cases derived from use cases.
- **PDF Export**: Export generated artifacts (domain objects, use cases, test cases) as PDF documents.

## 🛠 Technology Stack

ReqFlowly follows a three-tier architecture:

1. **Front-end**: React.js
2. **Back-end**: Java, Spring Boot (https://github.com/K-AMeus/reqFlowlyBE)
3. **Database**: PostgreSQL
4. **AI**: Google Cloud Vertex AI (Gemini 2.5 Flash)

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Access to Firebase project (for authentication)
- ReqFlowly Backend API running

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/K-AMeus/reqFlowlyFE
cd reqFlowlyFE
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Configuration

The application requires the following configuration:

1. **Firebase Configuration**: Update the Firebase configuration in `src/firebase/config.ts` with your Firebase project details.

2. **API Configuration**: By default, the API endpoint is set to `http://localhost:8080/api` in `src/helpers/apiUtils.ts`. Update this value if your backend API is running on a different address.


## 📁 Project Structure

```
src/
├── components/            # React components
├── context/               # Context providers (e.g., AuthContext)
├── firebase/              # Firebase configuration
├── helpers/               # Helper utilities
├── hooks/                 # Custom React hooks
├── services/              # API service layers
│   ├── ProjectService.ts  # Project-related API calls
│   ├── RequirementService.ts  # Requirement-related API calls
│   ├── DomainObjectService.ts  # Domain object-related API calls
│   ├── UseCaseService.ts  # Use case-related API calls
│   └── TestCaseService.ts  # Test case-related API calls
├── styles/                # CSS styles
├── types/                 # TypeScript type definitions
├── App.tsx                # Main application component with routing
└── main.tsx               # Application entry point
```