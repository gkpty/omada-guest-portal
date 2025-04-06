#!/bin/bash
terraform init
terraform validate
terraform plan -out=plan && read -p "Apply this plan? (y/n) " confirm
if [[ $confirm == [yY] ]]; then
  terraform apply plan
else
  echo "Plan not applied."
fi