import Employee from "../../models/employee.js";

export const employees = async (req, res) => {
  try {
    const employee = await Employee.find();

    res.status(200).json({
      message: "success",
      data: employee,
    });
  } catch (error) {
    console.log("error", error);

    res.status(200).json({
      message: "error",
      error,
    });
  }
};
