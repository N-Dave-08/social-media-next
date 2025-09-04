# One-time ECS Task Definition for Database Seeding
resource "aws_ecs_task_definition" "database_seeding" {
  family                   = "social-media-seeding"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "seeding-runner"
      image = "${var.ecr_repository_url}:latest"
      
      # Override the command to run only the seeding
      command = ["sh", "-c", "npm run db:seed"]
      
      essential = true
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://postgres:${var.db_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}?schema=public"
        },
        {
          name  = "ADMIN_EMAIL"
          value = var.admin_email
        },
        {
          name  = "ADMIN_PASSWORD"
          value = var.admin_password
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.seeding.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "seeding"
        }
      }
    }
  ])
}

# CloudWatch Log Group for seeding
resource "aws_cloudwatch_log_group" "seeding" {
  name              = "/ecs/social-media-seeding"
  retention_in_days = 7
} 