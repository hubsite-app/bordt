import React from "react";
import { SimpleGrid, useToast } from "@chakra-ui/react";
import { useJobsiteMaterialUpdateForm } from "../../../forms/jobsiteMaterial";
import {
  JobsiteMaterialCardSnippetFragment,
  JobsiteMaterialUpdateData,
  useJobsiteMaterialUpdateMutation,
} from "../../../generated/graphql";
import SubmitButton from "../../Common/forms/SubmitButton";

interface IJobsiteMaterialUpdate {
  jobsiteMaterial: JobsiteMaterialCardSnippetFragment;
  onSuccess?: () => void;
}

const JobsiteMaterialUpdate = ({
  jobsiteMaterial,
  onSuccess,
}: IJobsiteMaterialUpdate) => {
  /**
   * ----- Hook Initialization -----
   */

  const toast = useToast();

  const [update, { loading }] = useJobsiteMaterialUpdateMutation();

  const { FormComponents } = useJobsiteMaterialUpdateForm({
    defaultValues: {
      supplierId: jobsiteMaterial.supplier._id,
      quantity: jobsiteMaterial.quantity,
      unit: jobsiteMaterial.unit,
      rate: jobsiteMaterial.rate,
    },
  });

  /**
   * ----- Functions -----
   */

  const handleSubmit = React.useCallback(
    async (data: JobsiteMaterialUpdateData) => {
      try {
        const res = await update({
          variables: {
            id: jobsiteMaterial._id,
            data,
          },
        });

        if (res.data?.jobsiteMaterialUpdate) {
          if (onSuccess) onSuccess();
        } else {
          toast({
            status: "error",
            title: "Error",
            description: "Something went wrong, please try again",
            isClosable: true,
          });
        }
      } catch (e: any) {
        toast({
          status: "error",
          title: "Error",
          description: e.message,
          isClosable: true,
        });
      }
    },
    [jobsiteMaterial._id, onSuccess, toast, update]
  );

  /**
   * ----- Rendering -----
   */

  return (
    <FormComponents.Form submitHandler={handleSubmit}>
      <FormComponents.Supplier isLoading={loading} />
      <SimpleGrid spacing={2} columns={[1, 1, 3]}>
        <FormComponents.Quantity isLoading={loading} />
        <FormComponents.Unit isLoading={loading} />
        <FormComponents.Rate isLoading={loading} />
      </SimpleGrid>
      <SubmitButton isLoading={loading} />
    </FormComponents.Form>
  );
};

export default JobsiteMaterialUpdate;
