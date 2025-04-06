#!/bin/bash
export $(grep -v '^#' .env | xargs)
export TF_VAR_omada_portal_secret=$OMADA_PORTAL_SECRET
export TF_VAR_omada_controller_url=$OMADA_CONTROLLER_URL
export TF_VAR_project_name=$PROJECT_NAME
export TF_VAR_project_repo=$PROJECT_REPO
export TF_VAR_vercel_team_id=$VERCEL_TEAM_ID
export TF_VAR_vercel_api_token=$VERCEL_API_TOKEN

terraform init
terraform validate
terraform plan -out=plan && read -p "Apply this plan? (y/n) " confirm
if [[ $confirm == [yY] ]]; then
  terraform apply plan
else
  echo "Plan not applied."
fi