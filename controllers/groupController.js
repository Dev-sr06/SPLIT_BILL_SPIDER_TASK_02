const Group = require('../Group');
const User = require('../User'); 


const createGroup = async (req, res) => {
  const { name, members } = req.body; 

  if (!name || !members || !Array.isArray(members)) {
    return res.status(400).json({ message: 'Please provide group name and members' });
  }


  if (!members.includes(req.user._id.toString())) {
    members.push(req.user._id);
  }

  try {
    const group = await Group.create({
      name,
      creator: req.user._id,
      members: members
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id
    }).populate('creator', 'username').populate('members', 'username');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'username')
      .populate('members', 'username');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Ensure the user is a member of the group
    if (!group.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to view this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const addMemberToGroup = async (req, res) => {
  const { memberId } = req.body;

  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only the group creator can add members
    if (!group.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group creator can add members' });
    }

    if (group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    const userToAdd = await User.findById(memberId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User to add not found' });
    }

    group.members.push(memberId);
    await group.save();
    await group.populate('members', 'username'); // Repopulate to send updated members
    res.json({ message: 'Member added successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const removeMemberFromGroup = async (req, res) => {
  const { memberId } = req.body;

  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    
    if (!group.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the group creator can remove members' });
    }

    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    if (group.creator.equals(memberId)) {
        return res.status(400).json({ message: 'Group creator cannot be removed from the group' });
    }

    group.members = group.members.filter(member => !member.equals(memberId));
    await group.save();
    await group.populate('members', 'username');
    res.json({ message: 'Member removed successfully', group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.creator.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    await group.deleteOne(); 
    res.json({ message: 'Group removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup
};