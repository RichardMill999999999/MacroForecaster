# AWS deployment: Amplify frontend + App Runner API

The frontend is a Vite single-page app hosted by AWS Amplify Hosting and connected to the GitHub repository. Amplify builds and deploys the selected branch when changes are pushed. The Flask API runs separately as a container on AWS App Runner. The frontend calls the App Runner URL over HTTPS; Vite development continues to use `http://localhost:5000`.

## 1. Deploy the Flask API to App Runner

### Build and push the API image to ECR (PowerShell)

Choose the AWS region where the App Runner service will run:

```powershell
$Region = "us-east-1"
$Repository = "macroforecaster-api"
$AccountId = aws sts get-caller-identity --query Account --output text
$Registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$Image = "$Registry/${Repository}:latest"

aws ecr create-repository --repository-name $Repository --region $Region
aws ecr get-login-password --region $Region |
  docker login --username AWS --password-stdin $Registry
docker build --platform linux/amd64 -t $Image .
docker push $Image
```

If the ECR repository already exists, skip `aws ecr create-repository`. Use a versioned image tag for controlled releases.

### Create the App Runner service

In the AWS App Runner console:

1. Create a service from the ECR image URI.
2. Use the `linux/amd64` architecture and port `8080`.
3. Set the health-check path to `/health`.
4. Configure server-side environment variables and Secrets Manager references.
5. Deploy and verify `https://<your-service>.awsapprunner.com/health`.

Only set credentials for features that are used. Common server-side variables are:

- `MONGO_URI`, `MONGO_DB_NAME`
- `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `ALPACA_TRADING_URL`
- `POLYGON_API_KEY`, `FRED_API_KEY`, `FINNHUB_API_KEY`
- `OPENAI_API_KEY2`, `NEWSDATA_API_KEY`, `INEGI_TOKEN`, `BANXICO_TOKEN`
- `NYTKEY`, `NYT_SECRET`, `NYT_APP_ID`, `PASSKEY`

Store credentials as App Runner Secrets Manager/Parameter Store references. Set `CORS_ORIGIN` to the exact Amplify site origin, for example `https://main.<app-id>.amplifyapp.com` (no trailing slash). Add a custom domain here instead if one is configured for Amplify.

## 2. Connect the frontend to Amplify Hosting

1. In AWS Amplify, choose **New app → Host web app → GitHub**, authorize AWS if prompted, and select this repository and the branch you deploy from.
2. Amplify detects the checked-in `amplify.yml`; it runs `npm ci` and `npm run build`, then publishes `dist`.
3. After the first deploy, copy the Amplify app URL. In the Amplify app's **Hosting → Environment variables**, set `VITE_BACKEND_URL` to the App Runner URL, such as `https://<your-service>.awsapprunner.com`. The value is compiled into the public frontend bundle, so it must not contain secrets.
4. Redeploy the Amplify branch so the frontend uses the configured API URL.
5. In Amplify's **Rewrites and redirects** settings, add a single-page-app rewrite from `/<*>` to `/index.html` with status `200`, so refreshing a client-side route serves the app.
6. Push later changes to the connected branch to trigger Amplify builds and deployments automatically.

Amplify environment variables are build-time settings. If `VITE_BACKEND_URL` changes, start a new Amplify build. Do not put backend credentials in Amplify environment variables or in any `VITE_*` variable.

## MongoDB Atlas networking

App Runner's default outbound addresses are not fixed. Do not make an Atlas database public to `0.0.0.0/0` just to make the app connect. For an IP-restricted Atlas cluster, configure App Runner VPC egress through private subnets and a NAT Gateway with an Elastic IP, then allow only that Elastic IP in Atlas. This adds AWS networking cost. Also create a MongoDB database user with only the permissions the application needs.

## Local verification

```powershell
npm ci
npm run build
python -m py_compile app.py
docker build --platform linux/amd64 -t macroforecaster-api:local .
docker run --rm -p 8080:8080 --env-file .env macroforecaster-api:local
```

Open `http://localhost:8080/health`. The API container can start without optional provider keys, but corresponding integrations will report unavailable until their server-side credentials are configured.

The Docker image build requires Docker Desktop or another running Linux-container engine. A successful local Vite/Python build does not verify the container image.
