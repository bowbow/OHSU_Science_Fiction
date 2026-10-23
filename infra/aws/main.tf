data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

locals {
  name_prefix                         = var.environment_name
  bucket_name                         = "${var.environment_name}-releases-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  backup_bucket_name                  = "${var.environment_name}-backups-${data.aws_caller_identity.current.account_id}-${var.aws_region}"
  google_books_api_key_parameter_name = "/${var.environment_name}/google-books-api-key"
}

resource "aws_security_group" "bookclub" {
  name_prefix = "${local.name_prefix}-"
  description = "Public HTTP access for BookClub; administration uses Systems Manager"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "BookClub HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_http_cidrs
  }

  egress {
    description = "Package, AWS API, and book-cover access"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = { Name = "${local.name_prefix}-web" }
}

resource "aws_s3_bucket" "releases" {
  bucket = local.bucket_name

  tags = { Name = local.bucket_name }
}

resource "aws_s3_bucket_public_access_block" "releases" {
  bucket = aws_s3_bucket.releases.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "releases" {
  bucket = aws_s3_bucket.releases.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "releases" {
  bucket = aws_s3_bucket.releases.id

  rule {
    id     = "expire-old-releases"
    status = "Enabled"

    filter { prefix = "releases/" }

    expiration { days = var.release_retention_days }
  }
}

resource "aws_s3_bucket" "backups" {
  bucket = local.backup_bucket_name

  tags = { Name = local.backup_bucket_name }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id

  rule {
    id     = "expire-old-database-backups"
    status = "Enabled"

    filter { prefix = "database/" }

    expiration { days = var.backup_retention_days }

    noncurrent_version_expiration {
      noncurrent_days = var.backup_retention_days
    }
  }

  depends_on = [aws_s3_bucket_versioning.backups]
}

resource "aws_s3_bucket_policy" "backups_tls_only" {
  bucket = aws_s3_bucket.backups.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource = [
        aws_s3_bucket.backups.arn,
        "${aws_s3_bucket.backups.arn}/*"
      ]
      Condition = {
        Bool = { "aws:SecureTransport" = "false" }
      }
    }]
  })
}

resource "aws_iam_role" "bookclub" {
  name = "${local.name_prefix}-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "systems_manager" {
  role       = aws_iam_role.bookclub.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy" "release_read" {
  name = "read-bookclub-releases"
  role = aws_iam_role.bookclub.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = "${aws_s3_bucket.releases.arn}/releases/*"
    }]
  })
}

resource "aws_iam_role_policy" "database_backups" {
  name = "manage-bookclub-database-backups"
  role = aws_iam_role.bookclub.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListDatabaseBackups"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = aws_s3_bucket.backups.arn
        Condition = {
          StringLike = { "s3:prefix" = ["database/*"] }
        }
      },
      {
        Sid      = "ReadAndWriteDatabaseBackups"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = "${aws_s3_bucket.backups.arn}/database/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "google_books_api_key_read" {
  name = "read-google-books-api-key"
  role = aws_iam_role.bookclub.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter"]
      Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.environment_name}/google-books-api-key"
    }]
  })
}

resource "aws_iam_instance_profile" "bookclub" {
  name = "${local.name_prefix}-instance"
  role = aws_iam_role.bookclub.name
}

resource "aws_instance" "bookclub" {
  ami                         = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type               = var.instance_type
  subnet_id                   = sort(data.aws_subnets.default.ids)[0]
  vpc_security_group_ids      = [aws_security_group.bookclub.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.bookclub.name
  user_data                   = file("${path.module}/user-data.sh")
  user_data_replace_on_change = false

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    encrypted   = true
    volume_size = 12
    volume_type = "gp3"
  }

  lifecycle {
    # The database is stored on this instance's root volume. A newer value in
    # the "latest Amazon Linux" parameter or a bootstrap-script edit must not
    # replace or reconfigure the stateful server during an unrelated apply.
    # Runtime configuration is maintained by the deployment process.
    ignore_changes = [ami, user_data]
  }

  depends_on = [aws_iam_role_policy_attachment.systems_manager]

  tags = { Name = local.name_prefix }
}

resource "aws_eip" "bookclub" {
  domain = "vpc"

  tags = { Name = local.name_prefix }
}

resource "aws_eip_association" "bookclub" {
  instance_id   = aws_instance.bookclub.id
  allocation_id = aws_eip.bookclub.id
}

resource "aws_iam_role" "scheduler" {
  name = "${local.name_prefix}-scheduler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "scheduler_instance" {
  name = "start-stop-bookclub"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ec2:StartInstances", "ec2:StopInstances"]
      Resource = aws_instance.bookclub.arn
    }]
  })
}

resource "aws_scheduler_schedule" "stop" {
  name                         = "${local.name_prefix}-stop"
  description                  = "Stop BookClub at midnight Pacific."
  schedule_expression          = "cron(0 0 * * ? *)"
  schedule_expression_timezone = "America/Los_Angeles"
  state                        = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:stopInstances"
    role_arn = aws_iam_role.scheduler.arn
    input = jsonencode({
      InstanceIds = [aws_instance.bookclub.id]
    })
  }
}

resource "aws_scheduler_schedule" "start" {
  name                         = "${local.name_prefix}-start"
  description                  = "Start BookClub at 6:00am Pacific."
  schedule_expression          = "cron(0 6 * * ? *)"
  schedule_expression_timezone = "America/Los_Angeles"
  state                        = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:startInstances"
    role_arn = aws_iam_role.scheduler.arn
    input = jsonencode({
      InstanceIds = [aws_instance.bookclub.id]
    })
  }
}
