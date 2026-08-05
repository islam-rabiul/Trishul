const mongoose = require('mongoose');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Lead = require('./models/Lead');
const Task = require('./models/Task');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Data Seeding...');

    // 1. Ensure Admin Users exist
    const adminEmails = [
      { name: 'Admin User', email: 'admin@trishul.com', password: 'admin123', role: 'Admin', department: 'Management' },
      { name: 'Rabiul Islam', email: 'islamrabi@29gmail.com', password: 'admin123', role: 'Admin', department: 'Management' },
      { name: 'Rabiul Islam', email: 'islamrabi29@gmail.com', password: 'admin123', role: 'Admin', department: 'Management' }
    ];

    let admin;
    for (const adm of adminEmails) {
      let existing = await User.findOne({ email: adm.email });
      if (!existing) {
        existing = await User.create(adm);
        console.log(`Created Admin User: ${adm.email}`);
      } else {
        existing.password = adm.password;
        await existing.save();
      }
      if (!admin) admin = existing;
    }

    // 2. Create Supervisors & Team Employees
    const supervisorData = [
      { name: 'Rahul Verma', email: 'rahul.verma@trishul.com', password: 'password123', role: 'Supervisor', department: 'Sales Operations', phone: '+91 98765 43210' },
      { name: 'Ankit Sharma', email: 'ankit.sharma@trishul.com', password: 'password123', role: 'Supervisor', department: 'Customer Success', phone: '+91 98765 43211' }
    ];

    const supervisors = [];
    for (const sup of supervisorData) {
      let existing = await User.findOne({ email: sup.email });
      if (!existing) {
        existing = await User.create(sup);
        console.log(`Created Supervisor: ${sup.name}`);
      }
      supervisors.push(existing);
    }

    const employeeData = [
      { name: 'Priya Singh', email: 'priya.singh@trishul.com', password: 'password123', role: 'User', supervisorId: supervisors[0]._id, department: 'Sales', phone: '+91 98765 43212' },
      { name: 'Vikram Malhotra', email: 'vikram.m@trishul.com', password: 'password123', role: 'User', supervisorId: supervisors[0]._id, department: 'Sales', phone: '+91 98765 43213' },
      { name: 'Neha Kapoor', email: 'neha.kapoor@trishul.com', password: 'password123', role: 'User', supervisorId: supervisors[1]._id, department: 'Support', phone: '+91 98765 43214' },
      { name: 'Rabiul Islam', email: 'rabiul.islam@trishul.com', password: 'password123', role: 'User', supervisorId: supervisors[1]._id, department: 'Engineering', phone: '+91 98765 43215' }
    ];

    const employees = [admin, ...supervisors];
    for (const emp of employeeData) {
      let existing = await User.findOne({ email: emp.email });
      if (!existing) {
        existing = await User.create(emp);
        console.log(`Created Employee: ${emp.name}`);
      }
      employees.push(existing);
    }

    // 3. Seed Customers
    const customerData = [
      { name: 'TechNova Pvt Ltd', company: 'TechNova Solutions', phone: '+91 98200 11223', email: 'contact@technova.com', address: 'Bandra Kurla Complex, Mumbai', status: 'Active', totalRevenue: 350000, createdBy: admin._id },
      { name: 'Bright Solutions', company: 'Bright Technologies', phone: '+91 98200 22334', email: 'info@brightsolutions.io', address: 'Cyber City, Gurugram', status: 'Active', totalRevenue: 280000, createdBy: supervisors[0]._id },
      { name: 'NextGen Corp', company: 'NextGen Enterprises', phone: '+91 98200 33445', email: 'sales@nextgencorp.in', address: 'Koramangala, Bengaluru', status: 'Pending', totalRevenue: 150000, createdBy: supervisors[1]._id },
      { name: 'Apex Systems', company: 'Apex Global', phone: '+91 98200 44556', email: 'admin@apexsystems.com', address: 'HITEC City, Hyderabad', status: 'Active', totalRevenue: 420000, createdBy: employees[2]._id },
      { name: 'CloudScale Inc', company: 'CloudScale Tech', phone: '+91 98200 55667', email: 'hello@cloudscale.net', address: 'Viman Nagar, Pune', status: 'Inactive', totalRevenue: 0, createdBy: employees[3]._id }
    ];

    for (const cust of customerData) {
      const existing = await Customer.findOne({ email: cust.email });
      if (!existing) {
        await Customer.create(cust);
        console.log(`Created Customer: ${cust.name}`);
      }
    }

    // 4. Seed Leads (matching PDF demo data!)
    const leadData = [
      { leadName: 'TechNova Pvt Ltd', phone: '+91 98200 11223', email: 'contact@technova.com', source: 'Website', status: 'Won', assignedUser: employees[1]._id, estimatedValue: 120000, followUpDate: new Date('2026-08-15'), notes: 'High interest in enterprise license' },
      { leadName: 'Bright Solutions', phone: '+91 98200 22334', email: 'info@brightsolutions.io', source: 'Referral', status: 'Interested', assignedUser: employees[2]._id, estimatedValue: 85000, followUpDate: new Date('2026-08-18'), notes: 'Requested demo presentation' },
      { leadName: 'NextGen Corp', phone: '+91 98200 33445', email: 'sales@nextgencorp.in', source: 'Advertisement', status: 'Contacted', assignedUser: employees[3]._id, estimatedValue: 60000, followUpDate: new Date('2026-08-20'), notes: 'Initial proposal sent' },
      { leadName: 'Apex Systems', phone: '+91 98200 44556', email: 'admin@apexsystems.com', source: 'Social Media', status: 'New', assignedUser: employees[0]._id, estimatedValue: 150000, followUpDate: new Date('2026-08-22'), notes: 'Inbound inquiry from LinkedIn' },
      { leadName: 'Starlight Retail', phone: '+91 98200 66778', email: 'buying@starlightretail.com', source: 'Cold Call', status: 'New', assignedUser: employees[4]._id, estimatedValue: 45000, followUpDate: new Date('2026-08-25'), notes: 'Follow-up call scheduled' }
    ];

    for (const lead of leadData) {
      const existing = await Lead.findOne({ email: lead.email });
      if (!existing) {
        await Lead.create(lead);
        console.log(`Created Lead: ${lead.leadName}`);
      }
    }

    // 5. Seed Tasks
    const taskData = [
      { title: 'Follow up with TechNova', description: 'Confirm final contract terms for CRM onboarding', assignedTo: employees[1]._id, dueDate: new Date('2026-08-10'), priority: 'High', status: 'Pending' },
      { title: 'Schedule product demo for Bright Solutions', description: 'Demonstrate AI Assistant and Reporting features', assignedTo: employees[2]._id, dueDate: new Date('2026-08-12'), priority: 'Medium', status: 'Pending' },
      { title: 'Send customer proposal to NextGen Corp', description: 'Draft customized enterprise pricing proposal', assignedTo: employees[3]._id, dueDate: new Date('2026-08-14'), priority: 'High', status: 'Completed' },
      { title: 'Update Q3 Lead Pipeline Stats', description: 'Compile weekly performance report for supervisor review', assignedTo: employees[0]._id, dueDate: new Date('2026-08-16'), priority: 'Low', status: 'Pending' },
      { title: 'Review Inactive Customers', description: 'Reach out to customers with >30 days inactivity', assignedTo: employees[4]._id, dueDate: new Date('2026-08-18'), priority: 'Medium', status: 'Pending' }
    ];

    for (const task of taskData) {
      const existing = await Task.findOne({ title: task.title });
      if (!existing) {
        await Task.create(task);
        console.log(`Created Task: ${task.title}`);
      }
    }

    console.log('✅ Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
