const Expense = require('../Expense');
const Group = require('../Group');
const User = require('../User');

const addExpense = async (req, res) => {
  const { description, amount, category, groupId } = req.body;

  if (!description || !amount || !category || !groupId) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }

  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(member => member.equals(req.user._id))) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const expense = await Expense.create({
      description,
      amount,
      category,
      payer: req.user._id,
      group: groupId,
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getGroupExpenses = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(member => member.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to view expenses for this group' });
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('payer', 'username')
      .populate({
        path: 'group',
        populate: {
          path: 'members',
          select: 'username'
        }
      })
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (!expense.payer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getBillSplit = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'username');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Not authorized to view bill split for this group' });
    }

    const expenses = await Expense.find({ group: req.params.groupId })
      .populate('payer', 'username');

    const totalMembers = group.members.length;
    if (totalMembers === 0) {
      return res.json({ message: 'No members in this group to split bill.', transactions: [] });
    }

    const balances = {};
    group.members.forEach(member => {
      balances[member._id.toString()] = 0;
    });

    expenses.forEach(expense => {
      const perPersonShare = expense.amount / totalMembers;
      balances[expense.payer._id.toString()] += expense.amount; // Payer paid this much
      group.members.forEach(member => {
        balances[member._id.toString()] -= perPersonShare; // Everyone owes their share
      });
    });

   
    const creditors = []; // Users who are owed money (positive balance)
    const debtors = [];   // Users who owe money (negative balance)

    for (const userId in balances) {
      const balance = balances[userId];
      const user = group.members.find(m => m._id.toString() === userId);
      if (balance > 0.01) { 
        creditors.push({ user: user.username, id: userId, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ user: user.username, id: userId, amount: -balance }); // Store as positive debt
      }
    }

    creditors.sort((a, b) => b.amount - a.amount); 
    debtors.sort((a, b) => b.amount - a.amount); 

    const transactions = [];

    while (creditors.length > 0 && debtors.length > 0) {
      const creditor = creditors[0];
      const debtor = debtors[0];

      const settlementAmount = Math.min(creditor.amount, debtor.amount);

      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: parseFloat(settlementAmount.toFixed(2))
      });

      creditor.amount -= settlementAmount;
      debtor.amount -= settlementAmount;

      if (creditor.amount < 0.01) { // If creditor is fully paid
        creditors.shift();
      }
      if (debtor.amount < 0.01) { // If debtor has paid off their debt
        debtors.shift();
      }
    }

    res.json({
      summary: balances, // Raw balances
      transactions: transactions // Simplified transactions
    });

  } catch (error) {
    console.error('Error calculating bill split:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = {
  addExpense,
  getGroupExpenses,
  deleteExpense,
  getBillSplit
};