const User = require("../models/user.model");
const TeamMember = require("../models/teamMember.model");

/**
 * Populates presentAttendees with user name and team member functionalRole for a single MOM.
 * @param {Object} mom - Plain MOM object or Mongoose document
 * @returns {Promise<Object>} Populated plain MOM object
 */
async function populateMomAttendees(mom) {
  if (!mom) return null;
  const momObj = typeof mom.toObject === 'function' ? mom.toObject() : mom;
  
  if (!momObj.presentAttendees || momObj.presentAttendees.length === 0) {
    return momObj;
  }
  
  const userIds = momObj.presentAttendees.map(a => a.userId).filter(Boolean);
  if (userIds.length === 0) return momObj;
  
  const [users, teamMembers] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('name').lean(),
    TeamMember.find({ teamId: momObj.teamId, userId: { $in: userIds } }).select('userId functionalRole').lean()
  ]);
  
  const userMap = new Map(users.map(u => [u._id.toString(), u.name]));
  const roleMap = new Map(teamMembers.map(tm => [tm.userId.toString(), tm.functionalRole]));
  
  momObj.presentAttendees = momObj.presentAttendees.map(a => {
    if (!a.userId) return a;
    const uIdStr = a.userId.toString();
    return {
      userId: a.userId,
      name: userMap.get(uIdStr) || 'Unknown',
      functionalRole: roleMap.get(uIdStr) || 'Member'
    };
  });
  
  return momObj;
}

/**
 * Populates presentAttendees with user name and team member functionalRole for multiple MOMs.
 * @param {Array<Object>} moms - Plain MOM objects or Mongoose documents
 * @returns {Promise<Array<Object>>} Populated plain MOM objects
 */
async function populateMultipleMomsAttendees(moms) {
  if (!moms || moms.length === 0) return [];
  
  const userIdsSet = new Set();
  const teamIdsSet = new Set();
  
  const momObjs = moms.map(mom => {
    const obj = typeof mom.toObject === 'function' ? mom.toObject() : mom;
    if (obj.teamId) {
      teamIdsSet.add(obj.teamId.toString());
    }
    if (obj.presentAttendees) {
      obj.presentAttendees.forEach(a => {
        if (a.userId) {
          userIdsSet.add(a.userId.toString());
        }
      });
    }
    return obj;
  });
  
  const userIds = Array.from(userIdsSet);
  const teamIds = Array.from(teamIdsSet);
  
  if (userIds.length === 0) return momObjs;
  
  const [users, teamMembers] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select('name').lean(),
    TeamMember.find({ teamId: { $in: teamIds }, userId: { $in: userIds } }).select('teamId userId functionalRole').lean()
  ]);
  
  const userMap = new Map(users.map(u => [u._id.toString(), u.name]));
  const roleMap = new Map(teamMembers.map(tm => [`${tm.teamId.toString()}_${tm.userId.toString()}`, tm.functionalRole]));
  
  return momObjs.map(momObj => {
    if (momObj.presentAttendees && momObj.teamId) {
      momObj.presentAttendees = momObj.presentAttendees.map(a => {
        if (!a.userId) return a;
        const uIdStr = a.userId.toString();
        const roleKey = `${momObj.teamId.toString()}_${uIdStr}`;
        return {
          userId: a.userId,
          name: userMap.get(uIdStr) || 'Unknown',
          functionalRole: roleMap.get(roleKey) || 'Member'
        };
      });
    }
    return momObj;
  });
}

module.exports = {
  populateMomAttendees,
  populateMultipleMomsAttendees
};
