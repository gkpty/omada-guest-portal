
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# VARIABLES
variable "aws_region" {
  type        = string
  description = "The AWS region to deploy resources (e.g., us-east-1)"
  default     = "us-east-1"
}

variable "vercel_team_id" {
  type = string
}

variable "env" {
  type        = string
  description = "Environment tag (dev, staging, prod, etc.)"
  default     = "production"
}

variable "project_name" {
  type        = string
  default     = "mansa-wifi-portal"
}

variable "project_repo" {
  type        = string
  default     = "gkpty/omada-guest-portal"
}

variable "omada_controller_url" {
	type = string
}

variable "omada_portal_secret" {
	type = string
}


provider "aws" {
  region = var.aws_region
}


# DYNAMO DB TABLES
resource "aws_dynamodb_table" "mansa-wifi-guests" {
  name         = "mansa-wifi-guests"
  billing_mode = "PAY_PER_REQUEST"

  # Attributes
  attribute {
    name = "id"
    type = "S"
  }
  attribute {
    name = "name"
    type = "S"
  }

  # Key schema
  hash_key = "id"

  global_secondary_index {
    name            = "NameIndex"
    hash_key        = "name"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  tags = {
    Environment = var.env
    Name        = "mansa-wifi-guests"
    Project     = "mansa-wifi"
  }
}

resource "aws_iam_policy" "app_policy" {
  name        = "mansa-wifi-policy"
  description = "Policy granting DynamoDB access"
  policy      = data.aws_iam_policy_document.app_policy_doc.json
}

resource "aws_iam_user_policy_attachment" "app_user_attach" {
  user       = aws_iam_user.app_user.name
  policy_arn = aws_iam_policy.app_policy.arn
}

resource "vercel_project" "main" {
  name            = var.project_name
  framework       = "nextjs"
  git_repository  = {
    type = "github"
    repo = var.project_repo
  }
  build_command = "npm run build"

  environment = [
    {
      target = ["preview", "production"]
			key   = "NODE_ENV"
      value = "production"
    },

    
  ]
}

resource "vercel_deployment" "main" {
  project_id = vercel_project.main.id
  ref        = "main"
  production = false
}

# Outputs
output "warehouse_table_name" {
  description = "Name of the warehouse DynamoDB table"
  value       = aws_dynamodb_table.mansa-wifi-guests.name
}
