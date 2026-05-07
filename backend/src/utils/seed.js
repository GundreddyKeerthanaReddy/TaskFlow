const mongoose = require('mongoose');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const Team = require('../models/Team.model');
const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

const seedData = async () => {
  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Team.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  // Create users
  const users = await User.create([
    {
      name: 'Alex Morgan',
      email: 'admin@taskflow.com',
      password: 'password123',
      role: 'admin',
      jobTitle: 'Product Manager',
      department: 'Product',
      bio: 'Passionate about building great products and leading high-performing teams.',
      location: 'San Francisco, CA',
      theme: 'light'
    },
    {
      name: 'Sarah Chen',
      email: 'sarah@taskflow.com',
      password: 'password123',
      role: 'member',
      jobTitle: 'Senior Frontend Developer',
      department: 'Engineering',
      bio: 'React enthusiast with 5+ years of experience building scalable web apps.',
      location: 'New York, NY'
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus@taskflow.com',
      password: 'password123',
      role: 'member',
      jobTitle: 'Backend Engineer',
      department: 'Engineering',
      bio: 'Node.js and MongoDB specialist. Love clean architecture.',
      location: 'Austin, TX'
    },
    {
      name: 'Priya Patel',
      email: 'priya@taskflow.com',
      password: 'password123',
      role: 'member',
      jobTitle: 'UI/UX Designer',
      department: 'Design',
      bio: 'Creating beautiful and intuitive user experiences.',
      location: 'Seattle, WA'
    },
    {
      name: 'James Wilson',
      email: 'james@taskflow.com',
      password: 'password123',
      role: 'member',
      jobTitle: 'DevOps Engineer',
      department: 'Infrastructure',
      bio: 'Cloud infrastructure and CI/CD pipeline expert.',
      location: 'Chicago, IL'
    }
  ]);
  console.log(`Created ${users.length} users`);

  const [admin, sarah, marcus, priya, james] = users;

  // Create team
  const team = await Team.create({
    name: 'Core Product Team',
    description: 'The main product development team working on TaskFlow platform.',
    color: '#6366f1',
    owner: admin._id,
    members: [
      { user: admin._id, role: 'owner' },
      { user: sarah._id, role: 'admin' },
      { user: marcus._id, role: 'member' },
      { user: priya._id, role: 'member' },
      { user: james._id, role: 'member' }
    ]
  });

  // Create projects
  const projects = await Project.create([
    {
      name: 'TaskFlow Platform v2.0',
      description: 'Complete redesign and rebuild of the TaskFlow platform with new features and improved performance.',
      status: 'active',
      priority: 'critical',
      color: '#6366f1',
      icon: '🚀',
      owner: admin._id,
      members: [
        { user: admin._id, role: 'owner' },
        { user: sarah._id, role: 'admin' },
        { user: marcus._id, role: 'member' },
        { user: priya._id, role: 'member' }
      ],
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      tags: ['platform', 'redesign', 'v2'],
      taskCount: { total: 12, todo: 3, inProgress: 5, completed: 4 }
    },
    {
      name: 'Mobile App Development',
      description: 'Build native iOS and Android apps for TaskFlow with full feature parity.',
      status: 'active',
      priority: 'high',
      color: '#10b981',
      icon: '📱',
      owner: sarah._id,
      members: [
        { user: sarah._id, role: 'owner' },
        { user: marcus._id, role: 'member' },
        { user: james._id, role: 'member' }
      ],
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      tags: ['mobile', 'ios', 'android'],
      taskCount: { total: 8, todo: 4, inProgress: 2, completed: 2 }
    },
    {
      name: 'API Integration Suite',
      description: 'Build comprehensive REST API integrations with third-party tools like Slack, GitHub, and Jira.',
      status: 'planning',
      priority: 'medium',
      color: '#f59e0b',
      icon: '🔌',
      owner: marcus._id,
      members: [
        { user: marcus._id, role: 'owner' },
        { user: admin._id, role: 'admin' },
        { user: james._id, role: 'member' }
      ],
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      tags: ['api', 'integrations', 'backend'],
      taskCount: { total: 6, todo: 5, inProgress: 1, completed: 0 }
    },
    {
      name: 'Design System',
      description: 'Create a comprehensive design system with reusable components, tokens, and documentation.',
      status: 'active',
      priority: 'high',
      color: '#ec4899',
      icon: '🎨',
      owner: priya._id,
      members: [
        { user: priya._id, role: 'owner' },
        { user: sarah._id, role: 'member' },
        { user: admin._id, role: 'viewer' }
      ],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: ['design', 'ui', 'components'],
      taskCount: { total: 10, todo: 2, inProgress: 3, completed: 5 }
    },
    {
      name: 'Infrastructure Upgrade',
      description: 'Migrate to Kubernetes, set up monitoring, and improve deployment pipelines.',
      status: 'on-hold',
      priority: 'medium',
      color: '#64748b',
      icon: '⚙️',
      owner: james._id,
      members: [
        { user: james._id, role: 'owner' },
        { user: marcus._id, role: 'member' },
        { user: admin._id, role: 'viewer' }
      ],
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // overdue
      tags: ['devops', 'kubernetes', 'infrastructure'],
      taskCount: { total: 7, todo: 3, inProgress: 1, completed: 3 }
    }
  ]);
  console.log(`Created ${projects.length} projects`);

  const [p1, p2, p3, p4, p5] = projects;

  // Create tasks for project 1
  const tasks = await Task.create([
    // Project 1 tasks
    {
      title: 'Design new dashboard layout',
      description: 'Create wireframes and high-fidelity mockups for the new dashboard with analytics widgets.',
      status: 'completed',
      priority: 'high',
      project: p1._id,
      assignees: [priya._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      tags: ['design', 'dashboard'],
      position: 0,
      checklist: [
        { text: 'Create wireframes', completed: true },
        { text: 'Design mockups', completed: true },
        { text: 'Get stakeholder approval', completed: true }
      ]
    },
    {
      title: 'Implement authentication system',
      description: 'Build JWT-based auth with refresh tokens, role-based access control, and session management.',
      status: 'completed',
      priority: 'critical',
      project: p1._id,
      assignees: [marcus._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      tags: ['backend', 'auth'],
      position: 1
    },
    {
      title: 'Build Kanban board component',
      description: 'Implement drag-and-drop Kanban board with real-time updates and smooth animations.',
      status: 'in-progress',
      priority: 'high',
      project: p1._id,
      assignees: [sarah._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      tags: ['frontend', 'kanban'],
      position: 0,
      estimatedHours: 16,
      loggedHours: 8
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing, building, and deployment to Railway.',
      status: 'in-progress',
      priority: 'medium',
      project: p1._id,
      assignees: [james._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['devops', 'ci-cd'],
      position: 1
    },
    {
      title: 'Implement analytics dashboard',
      description: 'Build charts and graphs for productivity analytics using Recharts.',
      status: 'in-progress',
      priority: 'high',
      project: p1._id,
      assignees: [sarah._id, priya._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      tags: ['frontend', 'analytics'],
      position: 2
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST API endpoints with examples using Swagger/OpenAPI.',
      status: 'todo',
      priority: 'medium',
      project: p1._id,
      assignees: [marcus._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      tags: ['documentation', 'api'],
      position: 0
    },
    {
      title: 'Performance optimization',
      description: 'Optimize bundle size, implement lazy loading, and improve Core Web Vitals scores.',
      status: 'todo',
      priority: 'medium',
      project: p1._id,
      assignees: [sarah._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      tags: ['performance', 'frontend'],
      position: 1
    },
    {
      title: 'User testing and feedback',
      description: 'Conduct user testing sessions and collect feedback for iteration.',
      status: 'todo',
      priority: 'low',
      project: p1._id,
      assignees: [admin._id, priya._id],
      createdBy: admin._id,
      dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      tags: ['ux', 'testing'],
      position: 2
    },
    // Project 2 tasks
    {
      title: 'iOS app architecture setup',
      description: 'Set up React Native project with navigation, state management, and API integration.',
      status: 'in-progress',
      priority: 'high',
      project: p2._id,
      assignees: [sarah._id],
      createdBy: sarah._id,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      tags: ['ios', 'react-native'],
      position: 0
    },
    {
      title: 'Push notification system',
      description: 'Implement push notifications for task assignments and deadline reminders.',
      status: 'todo',
      priority: 'medium',
      project: p2._id,
      assignees: [marcus._id],
      createdBy: sarah._id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: ['notifications', 'mobile'],
      position: 0
    },
    // Project 4 tasks
    {
      title: 'Color token system',
      description: 'Define semantic color tokens for light and dark themes.',
      status: 'completed',
      priority: 'high',
      project: p4._id,
      assignees: [priya._id],
      createdBy: priya._id,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      tags: ['design-tokens', 'colors'],
      position: 0
    },
    {
      title: 'Button component variants',
      description: 'Design and document all button variants: primary, secondary, ghost, danger.',
      status: 'in-progress',
      priority: 'medium',
      project: p4._id,
      assignees: [priya._id, sarah._id],
      createdBy: priya._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      tags: ['components', 'buttons'],
      position: 0
    }
  ]);
  console.log(`Created ${tasks.length} tasks`);

  // Create activity logs
  await ActivityLog.create([
    {
      actor: admin._id,
      action: 'created',
      entityType: 'project',
      entityId: p1._id,
      entityTitle: p1.name,
      project: p1._id,
      description: `${admin.name} created project "${p1.name}"`
    },
    {
      actor: sarah._id,
      action: 'status_changed',
      entityType: 'task',
      entityId: tasks[2]._id,
      entityTitle: tasks[2].title,
      project: p1._id,
      metadata: { from: 'todo', to: 'in-progress' },
      description: `${sarah.name} moved "Build Kanban board component" to in-progress`
    },
    {
      actor: marcus._id,
      action: 'completed',
      entityType: 'task',
      entityId: tasks[1]._id,
      entityTitle: tasks[1].title,
      project: p1._id,
      description: `${marcus.name} completed "Implement authentication system"`
    },
    {
      actor: priya._id,
      action: 'created',
      entityType: 'project',
      entityId: p4._id,
      entityTitle: p4.name,
      project: p4._id,
      description: `${priya.name} created project "${p4.name}"`
    },
    {
      actor: admin._id,
      action: 'assigned',
      entityType: 'task',
      entityId: tasks[4]._id,
      entityTitle: tasks[4].title,
      project: p1._id,
      description: `${admin.name} assigned "${tasks[4].title}" to Sarah and Priya`
    }
  ]);

  // Create notifications
  await Notification.create([
    {
      recipient: sarah._id,
      sender: admin._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${admin.name} assigned you to "Build Kanban board component"`,
      entityType: 'task',
      entityId: tasks[2]._id,
      link: `/tasks/${tasks[2]._id}`
    },
    {
      recipient: marcus._id,
      sender: admin._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${admin.name} assigned you to "Write API documentation"`,
      entityType: 'task',
      entityId: tasks[5]._id,
      link: `/tasks/${tasks[5]._id}`
    },
    {
      recipient: admin._id,
      sender: sarah._id,
      type: 'task_completed',
      title: 'Task Completed',
      message: `${sarah.name} completed "Design new dashboard layout"`,
      entityType: 'task',
      entityId: tasks[0]._id,
      isRead: true,
      readAt: new Date()
    }
  ]);

  console.log('✅ Seed data created successfully!');
  console.log('\n📧 Login credentials:');
  console.log('  Admin: admin@taskflow.com / password123');
  console.log('  Member: sarah@taskflow.com / password123');
  console.log('  Member: marcus@taskflow.com / password123');
};

// Export for programmatic use (e.g. in-memory mode)
module.exports = { seedData };

// Run directly: node src/utils/seed.js
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return seedData();
    })
    .then(() => {
      console.log('\n📧 Login credentials:');
      console.log('  Admin: admin@taskflow.com / password123');
      console.log('  Member: sarah@taskflow.com / password123');
      return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
