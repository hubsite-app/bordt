import { CompanyModel } from "@models";

const companies = async (Company: CompanyModel) => {
  const paving = await Company.findOne({ isCompany: true });
  if (!paving) {
    const bordt = new Company({
      name: "Bordt & Sons",
      isCompany: true,
    });

    await bordt.save();
  }

  return;
};

export default {
  companies,
};
