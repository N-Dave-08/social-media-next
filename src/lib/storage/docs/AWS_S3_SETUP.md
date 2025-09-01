# AWS S3 Avatar Storage Setup Guide

This guide will help you set up AWS S3 for storing user avatars in your social media app.

## Prerequisites

- AWS Account
- Basic knowledge of AWS S3, IAM, and CloudFront (optional)

## Step 1: Create S3 Bucket

1. **Go to AWS S3 Console**
   - Navigate to https://console.aws.amazon.com/s3/
   - Click "Create bucket"

2. **Configure Bucket**
   - **Bucket name**: Choose a unique name (e.g., `your-app-avatars-2024`)
   - **Region**: Select a region close to your users
   - **Block Public Access**: **Uncheck "Block all public access"** (we'll use CloudFront for public access)
   - **Bucket Versioning**: Enable (recommended for data protection)
   - **Default encryption**: Enable (recommended)
   - Click "Create bucket"

## Step 2: Configure CORS

1. **Select your bucket** in the S3 console
2. **Go to "Permissions" tab**
3. **Scroll to "Cross-origin resource sharing (CORS)"**
4. **Click "Edit"** and add this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

5. **Click "Save changes"**

## Step 3: Create IAM User

1. **Go to IAM Console**
   - Navigate to https://console.aws.amazon.com/iam/
   - Click "Users" → "Create user"

2. **User Details**
   - **User name**: `s3-avatar-uploader`
   - **Access type**: Programmatic access
   - Click "Next"

3. **Attach Policy**
   - Click "Attach policies directly"
   - Click "Create policy"
   - Use JSON editor and paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

   - **Replace `YOUR-BUCKET-NAME`** with your actual bucket name
   - **Policy name**: `S3AvatarAccess`
   - Click "Create policy"
   - Go back to user creation and attach the new policy
   - Click "Next" → "Create user"

4. **Save Credentials**
   - **Download the CSV file** with Access Key ID and Secret Access Key
   - **Keep this secure** - you'll need it for your environment variables

## Step 4: Environment Variables

Add these variables to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

## Step 5: Optional - CloudFront CDN Setup

For better performance and global distribution:

1. **Go to CloudFront Console**
   - Navigate to https://console.aws.amazon.com/cloudfront/
   - Click "Create distribution"

2. **Configure Distribution**
   - **Origin domain**: Select your S3 bucket
   - **Origin access**: Use "Origin access control settings (recommended)"
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Cache policy**: Use "CachingOptimized"
   - **Price class**: Choose based on your needs
   - Click "Create distribution"

3. **Add CloudFront Domain to Environment**
   ```env
   CLOUDFRONT_DOMAIN="d1234567890abc.cloudfront.net"
   ```

## Step 6: Test the Setup

1. **Start your development server**
   ```bash
   pnpm dev
   ```

2. **Upload an avatar** through your app
3. **Check S3 bucket** - you should see the uploaded file
4. **Verify the URL** - it should be accessible directly

## Security Best Practices

1. **IAM Policy**: Only grant necessary permissions
2. **CORS**: Restrict origins in production
3. **Encryption**: Enable default encryption on S3 bucket
4. **Access Logging**: Enable for audit trails
5. **Lifecycle Rules**: Consider automatic deletion of old files
6. **CloudFront**: Use for better security and performance

## Cost Optimization

1. **S3 Storage**: Very cheap (~$0.023/GB/month)
2. **Data Transfer**: Free for uploads, charges for downloads
3. **CloudFront**: Reduces data transfer costs and improves performance
4. **Lifecycle Rules**: Automatically delete unused avatars

## Troubleshooting

### Common Issues:

1. **"Access Denied" errors**
   - Check IAM permissions
   - Verify bucket name in environment variables

2. **CORS errors**
   - Ensure CORS is properly configured
   - Check allowed origins

3. **"Bucket not found"**
   - Verify bucket name and region
   - Check AWS credentials

4. **Images not loading**
   - Check if bucket is public or CloudFront is configured
   - Verify file permissions

### Debug Commands:

```bash
# Check environment variables
echo $AWS_REGION
echo $AWS_S3_BUCKET_NAME

# Test S3 access (if you have AWS CLI installed)
aws s3 ls s3://your-bucket-name
```

## Migration from Local Storage

If you're migrating from local file storage:

1. **Backup existing avatars** (if migrating from local storage)
2. **Upload to S3** using AWS CLI or console
3. **Update database URLs** to point to S3
4. **Test thoroughly** before removing local files

## Production Considerations

1. **Use CloudFront** for better performance
2. **Set up monitoring** with CloudWatch
3. **Configure alerts** for costs and errors
4. **Regular backups** of S3 bucket
5. **Versioning** for data protection 