terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.73.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.1.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.3"
    }
  }
  required_version = ">= 1.2.0"
}

variable "aws_region" {
  type        = string
  description = "The AWS region to deploy resources (e.g., us-east-1)"
  default     = "us-east-1"
}

variable "env" {
  type        = string
  description = "Environment tag (dev, staging, prod, etc.)"
  default     = "production"
}

variable "project_name" {
  type    = string
  default = "mansa-wifi-portal"
}

variable "project_repo" {
  type    = string
  default = "gkpty/omada-guest-portal"
}

variable "vercel_team_id" {
  type = string
}
variable "vercel_api_token" {
  type = string
}

variable "omada_controller_url" {
  type = string
}

variable "omada_portal_secret" {
  type = string
}

provider "aws" {
  region = "us-east-1"
}
provider "vercel" {
  team = var.vercel_team_id
  api_token = var.vercel_api_token
}

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

resource "aws_iam_user" "app_user" {
  name = "mansa-wifi-portal"
}
resource "aws_iam_access_key" "s3_admin_user_key" {
  user = aws_iam_user.app_user.name
}

data "aws_iam_policy_document" "app_policy_doc" {
  statement {
    sid     = "DynamoDBAccess"
    effect  = "Allow"
    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:Describe*",
      "dynamodb:List*",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:UpdateItem"
    ]
    resources = [
      aws_dynamodb_table.mansa-wifi-guests.arn,
      "${aws_dynamodb_table.mansa-wifi-guests.arn}/*"
    ]
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
  name      = var.project_name
  framework = "nextjs"
  git_repository = {
    type = "github"
    repo = var.project_repo
  }
  build_command = "npm run build"

  environment = [
    {
      target = ["preview", "production"]
      key    = "NODE_ENV"
      value  = "production"
    },
    {
      target = ["preview", "production"]
      key   = "OMADA_PORTAL_SECRET"
      value = var.omada_portal_secret
    },
    {
      target = ["preview", "production"]
      key   = "OMADA_CONTROLLER_URL"
      value = var.omada_controller_url
    },
    {
      target = ["preview", "production"]
      key   = "PROJECT_NAME"
      value = var.project_name
    },
    {
      target = ["preview", "production"]
      key   = "PROJECT_REPO"
      value = var.project_repo
    },
    {
      target = ["preview", "production"]
      key   = "VERCEL_TEAM_ID"
      value = var.vercel_team_id
    },
    {
      target = ["preview", "production"]
      key   = "AWS_REGION"
      value = "us-east-1"
    },
    {
      target = ["preview", "production"]
      key   = "AWS_DEFAULT_REGION"
      value = "us-east-1"
    },
    {
      target = ["preview", "production"]
      key   = "AWS_ACCESS_KEY_ID"
      value = aws_iam_access_key.s3_admin_user_key.id
    },
    {
      target = ["preview", "production"]
      key   = "AWS_SECRET_ACCESS_KEY"
      value = aws_iam_access_key.s3_admin_user_key.secret
    },
  ]
}

resource "vercel_deployment" "main" {
  project_id = vercel_project.main.id
  ref        = "main"
}

output "mansa-wifi-guests_table_name" {
  description = "Name of the guests DynamoDB table"
  value       = aws_dynamodb_table.mansa-wifi-guests.name
}
