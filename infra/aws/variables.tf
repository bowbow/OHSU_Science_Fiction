variable "aws_region" {
  description = "AWS region for the BookClub environment."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "This deployment feature supports us-east-1."
  }
}

variable "environment_name" {
  description = "Stable lowercase environment identifier used in resource names and tags."
  type        = string
  default     = "bookclub-production"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}$", var.environment_name))
    error_message = "environment_name must be 3-31 lowercase letters, digits, or hyphens and start with a letter."
  }
}

variable "instance_type" {
  description = "EC2 instance type for the small BookClub site."
  type        = string
  default     = "t3.micro"
}

variable "allowed_http_cidrs" {
  description = "IPv4 CIDR ranges permitted to access HTTP."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "release_retention_days" {
  description = "Days to retain deployment archives in the private bucket."
  type        = number
  default     = 14

  validation {
    condition     = var.release_retention_days >= 1 && floor(var.release_retention_days) == var.release_retention_days
    error_message = "release_retention_days must be a positive whole number."
  }
}

variable "backup_retention_days" {
  description = "Days to retain weekly and pre-deployment SQLite backups."
  type        = number
  default     = 84

  validation {
    condition     = var.backup_retention_days >= 7 && floor(var.backup_retention_days) == var.backup_retention_days
    error_message = "backup_retention_days must be a whole number of at least 7."
  }
}
