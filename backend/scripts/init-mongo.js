// MongoDB initialization script
db = db.getSiblingDB('flowcraft');

// Create collections
db.createCollection('users');
db.createCollection('workflows');
db.createCollection('workflowrevisions');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.workflows.createIndex({ "ownerId": 1 });
db.workflows.createIndex({ "collaborators": 1 });
db.workflows.createIndex({ "isPublic": 1 });
db.workflows.createIndex({ "title": "text", "description": "text" });
db.workflowrevisions.createIndex({ "workflowId": 1, "version": -1 });

print('FlowCraft database initialized successfully!');
