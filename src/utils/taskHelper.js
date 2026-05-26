const User = require("../models/user.model");
const TeamMember = require("../models/teamMember.model");

/**
 * Populates a single task with resposibleName and responsibleFunctionalRole.
 * @param {Object} task - Plain task object or Mongoose document
 * @returns {Promise<Object>} Populated plain task object
 */
async function populateTaskResponsible(task) {
  if (!task) return null;
  const taskObj = typeof task.toObject === 'function' ? task.toObject() : task;
  
  if (!taskObj.responsibleId) return taskObj;
  
  const [user, teamMember] = await Promise.all([
    User.findById(taskObj.responsibleId).select('name').lean(),
    taskObj.teamId ? TeamMember.findOne({ teamId: taskObj.teamId, userId: taskObj.responsibleId }).select('functionalRole').lean() : null
  ]);
  
  taskObj.resposibleName = user ? user.name : 'Unknown';
  taskObj.responsibleFunctionalRole = teamMember ? teamMember.functionalRole : 'Member';
  
  return taskObj;
}

/**
 * Populates multiple tasks with resposibleName and responsibleFunctionalRole.
 * @param {Array<Object>} tasks - Plain task objects or Mongoose documents
 * @returns {Promise<Array<Object>>} Populated plain task objects
 */
async function populateMultipleTasksResponsible(tasks) {
  if (!tasks || tasks.length === 0) return [];
  
  const userIdsSet = new Set();
  const teamIdsSet = new Set();
  
  const taskObjs = tasks.map(task => {
    const obj = typeof task.toObject === 'function' ? task.toObject() : task;
    if (obj.responsibleId) {
      userIdsSet.add(obj.responsibleId.toString());
    }
    if (obj.teamId) {
      teamIdsSet.add(obj.teamId.toString());
    }
    return obj;
  });
  
  const userIds = Array.from(userIdsSet);
  const teamIds = Array.from(teamIdsSet);
  
  if (userIds.length === 0) return taskObjs;
  
  const [users, teamMembers] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('name').lean(),
    TeamMember.find({ teamId: { $in: teamIds }, userId: { $in: userIds } }).select('teamId userId functionalRole').lean()
  ]);
  
  const userMap = new Map(users.map(u => [u._id.toString(), u.name]));
  const roleMap = new Map(teamMembers.map(tm => [`${tm.teamId.toString()}_${tm.userId.toString()}`, tm.functionalRole]));
  
  return taskObjs.map(obj => {
    if (obj.responsibleId) {
      const uIdStr = obj.responsibleId.toString();
      obj.resposibleName = userMap.get(uIdStr) || 'Unknown';
      if (obj.teamId) {
        const roleKey = `${obj.teamId.toString()}_${uIdStr}`;
        obj.responsibleFunctionalRole = roleMap.get(roleKey) || 'Member';
      } else {
        obj.responsibleFunctionalRole = 'Member';
      }
    }
    return obj;
  });
}

module.exports = {
  populateTaskResponsible,
  populateMultipleTasksResponsible
};
