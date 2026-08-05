const User = require('../models/User');

// Returns the IDs a role is permitted to work with. Admins intentionally have
// no scope restriction; supervisors include themselves and their direct team.
exports.getPermittedUserIds = async (user) => {
  if (user.role === 'Admin') return null;
  if (user.role === 'User') return [user.id];

  const team = await User.find({ supervisorId: user.id }).select('_id');
  return [user.id, ...team.map(member => member._id.toString())];
};

exports.isInScope = async (user, ownerId) => {
  if (user.role === 'Admin') return true;
  if (!ownerId) return false;
  const permittedIds = await exports.getPermittedUserIds(user);
  return permittedIds.some(id => id.toString() === ownerId.toString());
};
