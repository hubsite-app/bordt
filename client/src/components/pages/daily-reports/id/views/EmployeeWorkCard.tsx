import { Box, Flex, IconButton, SimpleGrid, Text } from "@chakra-ui/react";
import dayjs from "dayjs";
import React from "react";
import { FiEdit, FiTrash, FiX } from "react-icons/fi";
import { useEmployeeWorkUpdateForm } from "../../../../../forms/employeeWork";

import {
  DailyReportFullDocument,
  EmployeeWorkCardSnippetFragment,
  EmployeeWorkUpdateData,
  useEmployeeWorkDeleteMutation,
  useEmployeeWorkUpdateMutation,
} from "../../../../../generated/graphql";
import convertHourToDate from "../../../../../utils/convertHourToDate";
import hourString from "../../../../../utils/hourString";
import SubmitButton from "../../../../Common/forms/SubmitButton";
import Permission from "../../../../Common/Permission";

interface IEmployeeWorkCard {
  employeeWork: EmployeeWorkCardSnippetFragment;
  dailyReportDate: Date;
  editPermission?: boolean;
}

const EmployeeWorkCard = ({
  employeeWork,
  dailyReportDate,
  editPermission,
}: IEmployeeWorkCard) => {
  /**
   * ----- Hook Initialization
   */

  const [edit, setEdit] = React.useState(false);

  const [update, { loading }] = useEmployeeWorkUpdateMutation();

  const [remove] = useEmployeeWorkDeleteMutation({
    variables: {
      id: employeeWork._id,
    },
    refetchQueries: [DailyReportFullDocument],
  });

  const { FormComponents } = useEmployeeWorkUpdateForm({
    defaultValues: {
      jobTitle: employeeWork.jobTitle,
      startTime: employeeWork.startTime,
      endTime: employeeWork.endTime,
    },
  });

  /**
   * ----- Functions -----
   */

  const submitUpdate = React.useCallback(
    (data: EmployeeWorkUpdateData) => {
      let startTime = data.startTime;
      if (!dayjs(startTime).isValid()) {
        startTime = convertHourToDate(data.startTime, dailyReportDate);
      }

      let endTime = data.endTime;
      if (!dayjs(endTime).isValid()) {
        endTime = convertHourToDate(data.endTime, dailyReportDate);
      }

      update({
        variables: {
          id: employeeWork._id,
          data: {
            ...data,
            startTime,
            endTime,
          },
        },
      }).then(() => setEdit(false));
    },
    [dailyReportDate, employeeWork._id, update]
  );

  /**
   * ----- Variables -----
   */

  const hours = React.useMemo(() => {
    return Math.abs(
      dayjs(employeeWork.endTime).diff(employeeWork.startTime, "hours")
    );
  }, [employeeWork.endTime, employeeWork.startTime]);

  /**
   * ----- Rendering -----
   */

  return (
    <Box p={2} w="100%" key={employeeWork._id} border="1px solid lightgray">
      <Box display="flex" flexDir="row" justifyContent="space-between">
        <Box>
          <Text>
            <Text as="span" fontWeight="bold">
              {employeeWork.jobTitle}
            </Text>{" "}
            - {employeeWork.employee.name}
          </Text>
          <Text>
            {dayjs(employeeWork.startTime).format("h:mm a")} -{" "}
            {dayjs(employeeWork.endTime).format("h:mm a")} ({hours}{" "}
            {hourString(hours)})
          </Text>
        </Box>
        <Flex flexDir="row">
          <Permission otherCriteria={editPermission}>
            {edit && (
              <IconButton
                backgroundColor="transparent"
                icon={<FiTrash />}
                aria-label="delete"
                onClick={() => window.confirm("Are you sure?") && remove()}
              />
            )}
            <IconButton
              backgroundColor="transparent"
              icon={edit ? <FiX /> : <FiEdit />}
              aria-label="edit"
              onClick={() => setEdit(!edit)}
            />
          </Permission>
        </Flex>
      </Box>
      {edit && (
        <Box backgroundColor="gray.200" p={2} borderRadius={4}>
          <FormComponents.Form submitHandler={submitUpdate}>
            <FormComponents.JobTitle
              isLoading={loading}
              backgroundColor="white"
            />
            <SimpleGrid columns={[1, 1, 2]}>
              <FormComponents.StartTime
                mx={1}
                isLoading={loading}
                backgroundColor="white"
              />
              <FormComponents.EndTime
                mx={1}
                isLoading={loading}
                backgroundColor="white"
              />
            </SimpleGrid>
            <SubmitButton isLoading={loading} />
          </FormComponents.Form>
        </Box>
      )}
    </Box>
  );
};

export default EmployeeWorkCard;
