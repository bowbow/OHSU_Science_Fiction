output "instance_id" {
  description = "EC2 instance targeted by Systems Manager deployment commands."
  value       = aws_instance.bookclub.id
}

output "elastic_ip" {
  description = "Stable public IPv4 address for BookClub."
  value       = aws_eip.bookclub.public_ip
}

output "site_url" {
  description = "Initial public BookClub URL."
  value       = "http://${aws_eip.bookclub.public_ip}"
}

output "release_bucket" {
  description = "Private S3 bucket used for immutable deployment archives."
  value       = aws_s3_bucket.releases.id
}

output "backup_bucket" {
  description = "Private S3 bucket containing weekly and pre-deployment SQLite backups."
  value       = aws_s3_bucket.backups.id
}

output "aws_region" {
  description = "AWS region containing the BookClub environment."
  value       = var.aws_region
}

output "google_books_api_key_parameter_name" {
  description = "Parameter Store name containing the production Google Books API key."
  value       = local.google_books_api_key_parameter_name
}
