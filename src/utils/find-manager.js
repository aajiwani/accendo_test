const db = require("./../database/index");

const findManager = async (
  managerName,
  managerJobId,
  orgId,
  transaction = null
) => {
  let findManagerParams = {
    where: {
      employeeName: managerName,
      jobId: managerJobId,
      belongs_to: orgId,
    },
    rejectOnEmpty: true,
  };

  if (transaction !== null) {
    findManagerParams = { ...findManagerParams, transaction: transaction };
  }

  try {
    return await db.accendo.Employee.findOne(findManagerParams);
  } catch (e) {
    // Looks like we found someone without manager in the organization
    if (transaction !== null) await transaction.rollback();
    throw new Error(
      "We expected everyone in the organization to have a manager"
    );
  }
};

module.exports = findManager;
