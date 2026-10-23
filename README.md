# Campus Predictive Maintenance System

A machine learning–powered web application designed to help campus administrators understand facility maintenance issues, analyze historical records, predict potential facility risks, and prioritize maintenance activities.

## 1. Project Overview

Campus Predictive Maintenance is a web-based application that brings facility information, maintenance records, analytics, and machine learning predictions together in one dashboard.

The application helps users explore maintenance data, identify locations with historical high-severity issues, and estimate facility risk using a trained machine learning model.

The project uses a React frontend, a Flask REST API backend, and Python machine learning libraries.

## 2. Features

- **Dashboard:** View maintenance statistics and an overview of facility information.
- **Facilities Overview:** Review available facility summaries.
- **Risk Prediction:** Submit facility information to receive a machine learning–based risk prediction.
- **Analytics:** Explore maintenance data through analytical summaries and visualizations.
- **Priority Overview:** Review historical maintenance records ranked using the project's demonstration priority rules.
- **Maintenance Logs:** View, search, and filter maintenance records.
- **Maintenance Record Details:** View individual maintenance records and manage supported maintenance workflow information.
- **REST API:** Connect the React frontend to the Flask backend through HTTP endpoints.
- **GitHub-Based Deployment:** Support separate frontend and backend deployments.

**Important:** Predictions and priority rankings are decision-support outputs. They are not verified live alerts or guarantees that a facility requires repair.

## 3. Technologies Used

### Frontend

- React
- JavaScript
- Vite
- HTML5
- CSS3
- Lucide React
- npm

### Backend

- Python
- Flask
- REST API
- JSON-based request and response handling

### Machine Learning and Data Processing

- scikit-learn
- NumPy
- SciPy
- Joblib
- Trained machine learning model files

### Development and Deployment

- Visual Studio Code
- Git and GitHub
- Render
- Python virtual environment (`venv`)


## 4. Prerequisites

Install the following software before running the project:

1. **Python** — use a version compatible with the project's machine learning dependencies.
2. **Node.js and npm** — required to install and run the React frontend.
3. **Git** — useful for downloading and managing the source code.
4. **Visual Studio Code** — recommended for editing the project.
5. **Backend dependencies** — installed using the Python requirements file.
6. **Frontend dependencies** — installed using npm.

Verify your installations:

```commands
python --version
node --version
npm --version
git --version
```

## 5. Installation and Setup

### Step 1: Open the project

Open the project folder in Visual Studio Code.

The project root should be:

```text
Your_project_path\campus-predictive-maintenance(your project name if changed)
```

Open two separate terminals in VS Code: one for the backend and one for the frontend.

### Step 2: Set up the backend

In the first terminal, navigate to the project root:
```command
cd Your_project_path\campus-predictive-maintenance
```

Create a virtual environment if one does not already exist:
```command
python -m venv .venv
```

Activate it in Windows PowerShell:

```powershell command
.\.venv\Scripts\Activate.ps1
```

If the terminal is Command Prompt instead of PowerShell, activate it using:

```Command Prompt command
.venv\Scripts\activate

If the above command not work use this insted:
.venv\Scripts\activate.bat
```

Navigate to the backend folder:

```command
cd backend
```

Install the backend dependencies:
```commands

python -m pip install --upgrade pip
python -m pip install -r requirements.txt

```
The `requirements.txt` file must contain all the Python packages required by `app.py` and the saved machine learning models. Verify that this file exists and is complete before relying on the installation command.

Start the Flask backend:
```command

python app.py

```

The backend is expected to run at:

```text
http://127.0.0.1:5000
```

Keep this terminal open while using the application.

### Step 3: Configure the frontend API URL

Open a second terminal and navigate to the frontend folder:

```command
cd Your_project_path\campus-predictive-maintenance\frontend
```

Create a file named `.env.local` in the frontend folder, alongside `package.json`.

Add:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

This tells the frontend to use the local Flask API.

The shared API helper reads this environment variable, allowing the application to use a different backend URL when deployed.


### Step 4: Install frontend dependencies

In the second terminal, make sure you are inside the frontend folder:

```command
cd Your_project_path\campus-predictive-maintenance\frontend
```

Install the required npm packages:

```command
npm install
```

### Step 5: Start the frontend

Run:

```command
npm run dev
```

Vite will display a local development URL, normally:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

Both terminals must remain running:

- Terminal 1: Flask backend
- Terminal 2: React frontend

## 7. Running the Project After Initial Setup

Once the dependencies are installed, you do not need to reinstall them every time.

**Terminal 1 — Backend**

```commands
1) cd Your_project_path\campus-predictive-maintenance
2) .venv\Scripts\Activate
3) cd backend
4) python app.py
```

**Terminal 2 — Frontend**

```command
1) cd Your_project_path\campus-predictive-maintenance\frontend
2) npm run dev
```

Open the URL printed by Vite.

## 8. API Configuration

The frontend uses a shared API helper located at:

```text
frontend/src/services/api.js
```

The API base URL is selected through the `VITE_API_BASE_URL` environment variable, with a local URL as the fallback.

### Local configuration

```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

### Production configuration

For the deployed frontend, configure the environment variable in the frontend hosting provider:

```text
VITE_API_BASE_URL=<your-deployed-backend-URL>/api
```

Replace the placeholder with the actual backend URL.

After changing a Vite environment variable in the hosting dashboard, rebuild or redeploy the frontend so the new value is included in the build.

Environment variables prefixed with `VITE_` are exposed to the browser bundle. Never put database passwords, API secrets, or other private credentials in them.

## 9. Machine Learning Model Files

The backend loads trained machine learning models from the project's model directory.

For example:

```text
backend/models/issue_model.pkl
```

The model files must be present at the paths expected by the backend code.

Joblib model files can depend on the versions of Python, scikit-learn, NumPy, and SciPy used when they were created. Use compatible dependency versions when loading saved models.

Do not delete or replace trained model files unless the corresponding model has been regenerated and tested.

## 10. Troubleshooting

### Backend does not start

Check that the virtual environment is activated and that the terminal is inside the backend folder.

```powershell
python --version
python -m pip list
python app.py
```

If a package is missing, install the correct dependency after verifying the backend requirements.

### Frontend does not start

Navigate to the frontend folder and install its dependencies:

```powershell
cd frontend
npm install
npm run dev
```

### Frontend cannot connect to the backend

1. Verify that the Flask server is running.
2. Confirm that `VITE_API_BASE_URL` points to the correct API base URL.
3. Check that the backend is listening on port `5000` locally.
4. Check the browser developer console and Network tab for failed requests.
5. Verify the backend's CORS configuration if the browser reports a cross-origin error.

### Saved model fails to load

Check that the model file exists and that its dependencies are compatible with the environment. An operating-system security policy can also prevent compiled Python libraries from loading.

### Online backend responds slowly on the first request

Free hosting services may stop inactive backend instances. The first request after inactivity can be slow while the service starts again. Local execution does not necessarily have this delay.

## 11. Deployment

The application can be deployed using separate hosting services.

- **Frontend:** Render Static Sites or Vercel.
- **Backend:** A Python-compatible hosting service such as Render or a configured virtual machine.
- **Database:** PostgreSQL, if configured for the deployment.

Configure the production API URL in the frontend hosting environment and the required server-side settings in the backend hosting environment.

The frontend and backend must use compatible API routes, and the backend must allow requests from the deployed frontend's origin.

## 12. Future Improvements

Potential improvements include:

- More historical maintenance data.
- Further evaluation and validation of model predictions.
- Improved prediction confidence and model-performance reporting.
- More detailed maintenance analytics.
- Automated database backups and deployment monitoring.
- Additional API tests and error handling.
- Improved documentation for model training and data preparation.

## 13. Disclaimer

This project is intended for educational and demonstration purposes. Its predictions and historical priority rankings should not be treated as verified real-world safety assessments or as substitutes for professional facility inspections.

---
**Project:** Campus Predictive Maintenance System  
**Frontend:** React and Vite  
**Backend:** Python and Flask  
**Machine Learning:** scikit-learn and Joblib
