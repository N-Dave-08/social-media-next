# Database ERD - Visual Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    User {
        string id PK "CUID"
        string email UK "Unique"
        string username UK "Unique"
        string name "Display Name"
        string bio "Optional"
        string avatar "Optional URL"
        string password "Hashed"
        enum role "USER/ADMIN"
        datetime createdAt "Auto"
        datetime updatedAt "Auto"
    }
    
    Post {
        string id PK "CUID"
        string content "Text Content"
        string imageUrl "Optional URL"
        datetime createdAt "Auto"
        datetime updatedAt "Auto"
        string authorId FK "→ User.id"
    }
    
    Comment {
        string id PK "CUID"
        string content "Text Content"
        datetime createdAt "Auto"
        datetime updatedAt "Auto"
        string userId FK "→ User.id"
        string postId FK "→ Post.id"
    }
    
    Like {
        string id PK "CUID"
        string userId FK "→ User.id"
        string postId FK "→ Post.id"
    }
    
    Follow {
        string id PK "CUID"
        string followerId FK "→ User.id"
        string followingId FK "→ User.id"
    }
    
    RefreshToken {
        string id PK "CUID"
        string token UK "Unique"
        string userId FK "→ User.id"
        datetime expiresAt "Expiration"
        datetime createdAt "Auto"
        boolean isRevoked "Status"
    }
    
    %% Relationships with cardinality
    User ||--o{ Post : "creates"
    User ||--o{ Comment : "writes"
    User ||--o{ Like : "gives"
    User ||--o{ RefreshToken : "has"
    User ||--o{ Follow : "follows"
    User ||--o{ Follow : "is_followed_by"
    Post ||--o{ Comment : "receives"
    Post ||--o{ Like : "receives"
```

## Alternative View: Database Tables Layout

```mermaid
graph TB
    subgraph "Database Tables"
        subgraph "users"
            U1[User Table]
            U1 --> U1_ID[id: string PK]
            U1 --> U1_EMAIL[email: string UK]
            U1 --> U1_USERNAME[username: string UK]
            U1 --> U1_NAME[name: string]
            U1 --> U1_BIO[bio: string?]
            U1 --> U1_AVATAR[avatar: string?]
            U1 --> U1_PASSWORD[password: string]
            U1 --> U1_ROLE[role: UserRole]
            U1 --> U1_TIMESTAMPS[createdAt, updatedAt]
        end
        
        subgraph "posts"
            P1[Post Table]
            P1 --> P1_ID[id: string PK]
            P1 --> P1_CONTENT[content: string]
            P1 --> P1_IMAGE[imageUrl: string?]
            P1 --> P1_AUTHOR[authorId: string FK]
            P1 --> P1_TIMESTAMPS[createdAt, updatedAt]
        end
        
        subgraph "comments"
            C1[Comment Table]
            C1 --> C1_ID[id: string PK]
            C1 --> C1_CONTENT[content: string]
            C1 --> C1_USER[userId: string FK]
            C1 --> C1_POST[postId: string FK]
            C1 --> C1_TIMESTAMPS[createdAt, updatedAt]
        end
        
        subgraph "likes"
            L1[Like Table]
            L1 --> L1_ID[id: string PK]
            L1 --> L1_USER[userId: string FK]
            L1 --> L1_POST[postId: string FK]
        end
        
        subgraph "follows"
            F1[Follow Table]
            F1 --> F1_ID[id: string PK]
            F1 --> F1_FOLLOWER[followerId: string FK]
            F1 --> F1_FOLLOWING[followingId: string FK]
        end
        
        subgraph "refresh_tokens"
            R1[RefreshToken Table]
            R1 --> R1_ID[id: string PK]
            R1 --> R1_TOKEN[token: string UK]
            R1 --> R1_USER[userId: string FK]
            R1 --> R1_EXPIRES[expiresAt: datetime]
            R1 --> R1_CREATED[createdAt: datetime]
            R1 --> R1_REVOKED[isRevoked: boolean]
        end
    end
    
    %% Relationships
    U1 -.->|1:N| P1
    U1 -.->|1:N| C1
    U1 -.->|1:N| L1
    U1 -.->|1:N| R1
    U1 -.->|N:N| F1
    P1 -.->|1:N| C1
    P1 -.->|1:N| L1
```

## Database Schema Summary

### Core Entities
1. **User** - Central entity for user accounts and profiles
2. **Post** - User-generated content posts
3. **Comment** - User comments on posts
4. **Like** - User reactions to posts
5. **Follow** - User-to-user follow relationships
6. **RefreshToken** - Authentication token management

### Key Relationships
- **User → Post**: One-to-Many (User creates multiple posts)
- **User → Comment**: One-to-Many (User writes multiple comments)
- **User → Like**: One-to-Many (User gives multiple likes)
- **Post → Comment**: One-to-Many (Post receives multiple comments)
- **Post → Like**: One-to-Many (Post receives multiple likes)
- **User ↔ User**: Many-to-Many through Follow (followers/following)

### Database Features
- **Primary Keys**: All tables use CUID strings
- **Foreign Keys**: Proper referential integrity with CASCADE deletes
- **Unique Constraints**: Email, username, like combinations, follow combinations
- **Timestamps**: Automatic creation and update tracking
- **Naming**: Snake_case table names via Prisma mapping

### Performance Notes
- All foreign keys are automatically indexed
- Unique constraints provide additional indexing
- Consider adding indexes on frequently queried timestamp fields
- CUID generation supports distributed systems 