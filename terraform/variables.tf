variable "ecr_repository_url" {
  description = "URL of the ECR repository for the Docker image"
  type        = string
  default     = "337909777510.dkr.ecr.us-east-2.amazonaws.com/social-media-app"
}

variable "nextauth_secret" {
  description = "Secret for NextAuth.js"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret for JWT tokens"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-2"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  type        = string
  default     = "davesocialmediaapp"
}

variable "cloudfront_domain" {
  description = "CloudFront CDN domain"
  type        = string
  default     = "d1ch31psf2hczd.cloudfront.net"
}