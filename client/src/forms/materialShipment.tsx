import React from "react";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  Controller,
  SubmitHandler,
  useForm,
  UseFormProps,
} from "react-hook-form";
import * as yup from "yup";
import {
  JobsiteMaterialCardSnippetFragment,
  MaterialShipmentShipmentData,
} from "../generated/graphql";

import TextField, { ITextField } from "../components/Common/forms/TextField";
import { IFormProps } from "../typescript/forms";
import MaterialSearch from "../components/Search/MaterialSearch";
import Select, { ISelect } from "../components/Common/forms/Select";
import Unit, { IUnit } from "../components/Common/forms/Unit";
import Number, { INumber } from "../components/Common/forms/Number";
import CompanySearch from "../components/Search/CompanySearch";
import { isEmpty } from "lodash";

const MaterialShipmentUpdate = yup
  .object()
  .shape({
    noJobsiteMaterial: yup.boolean().required(),
    jobsiteMaterialId: yup.string().when("noJobsiteMaterial", {
      is: false,
      then: yup.string().required("must provide material"),
    }),
    shipmentType: yup
      .string()
      .nullable()
      .when("noJobsiteMaterial", {
        is: true,
        then: yup.string().required("must provide material"),
      }),
    supplier: yup
      .string()
      .nullable()
      .when("noJobsiteMaterial", {
        is: true,
        then: yup.string().required("must provide supplier"),
      }),
    unit: yup
      .string()
      .nullable()
      .when("noJobsiteMaterial", {
        is: true,
        then: yup.string().required("must provide unit"),
      }),
    quantity: yup.number().required(),
    startTime: yup.string().optional(),
    endTime: yup.string().optional(),
  })
  .required();

export const useMaterialShipmentUpdateForm = (options?: UseFormProps) => {
  const form = useForm({
    resolver: yupResolver(MaterialShipmentUpdate),
    ...options,
  });

  const { control, handleSubmit, watch, setValue } = form;

  const jobsiteMaterialId = watch("jobsiteMaterialId");

  const noJobsiteMaterial = watch("noJobsiteMaterial");

  React.useEffect(() => {
    if (isEmpty(jobsiteMaterialId)) setValue("noJobsiteMaterial", true);
    else setValue("noJobsiteMaterial", false);
  }, [jobsiteMaterialId, setValue]);

  const FormComponents = {
    Form: ({
      children,
      submitHandler,
    }: {
      children: React.ReactNode;
      submitHandler: SubmitHandler<MaterialShipmentShipmentData>;
    }) => <form onSubmit={handleSubmit(submitHandler)}>{children}</form>,
    JobsiteMaterial: ({
      isLoading,
      jobsiteMaterials,
      ...props
    }: IFormProps<Omit<ISelect, "options">> & {
      jobsiteMaterials: JobsiteMaterialCardSnippetFragment[];
    }) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="jobsiteMaterialId"
            render={({ field, fieldState }) => (
              <Select
                {...props}
                {...field}
                options={jobsiteMaterials.map((material) => {
                  return {
                    title: `${material.material.name} - ${material.supplier.name}`,
                    value: material._id,
                  };
                })}
                errorMessage={fieldState.error?.message}
                label="Material"
                isDisabled={isLoading}
                placeholder="Material not listed"
              />
            )}
          />
        ),
        [isLoading, jobsiteMaterials, props]
      ),
    ShipmentType: ({ isLoading, ...props }: IFormProps<ITextField>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="shipmentType"
            render={({ field, fieldState }) => (
              <MaterialSearch
                {...props}
                {...field}
                defaultValue={field.value}
                errorMessage={fieldState.error?.message}
                label="Shipment Type"
                isDisabled={isLoading}
                materialSelected={(material) =>
                  setValue("shipmentType", material.name)
                }
              />
            )}
          />
        ),
        [isLoading, props]
      ),
    Supplier: ({ isLoading, ...props }: IFormProps<ITextField>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="supplier"
            render={({ field, fieldState }) => (
              <CompanySearch
                {...props}
                {...field}
                defaultValue={field.value}
                errorMessage={fieldState.error?.message}
                label="Supplier"
                isDisabled={isLoading}
                companySelected={(company) => {
                  setValue("supplier", company.name);
                }}
              />
            )}
          />
        ),
        [isLoading, props]
      ),
    StartTime: ({ isLoading, ...props }: IFormProps<ITextField>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="startTime"
            render={({ field, fieldState }) => {
              return (
                <TextField
                  {...props}
                  {...field}
                  type="time"
                  errorMessage={fieldState.error?.message}
                  label="Start Time (Optional)"
                  isDisabled={isLoading}
                />
              );
            }}
          />
        ),
        [isLoading, props]
      ),
    EndTime: ({ isLoading, ...props }: IFormProps<ITextField>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="endTime"
            render={({ field, fieldState }) => (
              <TextField
                {...props}
                {...field}
                type="time"
                errorMessage={fieldState.error?.message}
                label="End Time (Optional)"
                isDisabled={isLoading}
              />
            )}
          />
        ),
        [isLoading, props]
      ),
    Quantity: ({ isLoading, ...props }: IFormProps<INumber>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="quantity"
            render={({ field, fieldState }) => (
              <Number
                {...props}
                {...field}
                errorMessage={fieldState.error?.message}
                label="Quantity"
                isDisabled={isLoading}
              />
            )}
          />
        ),
        [isLoading, props]
      ),
    Unit: ({ isLoading, ...props }: IFormProps<IUnit>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="unit"
            render={({ field, fieldState }) => (
              <Unit
                {...props}
                {...field}
                errorMessage={fieldState.error?.message}
                label="Unit"
                isDisabled={isLoading}
              />
            )}
          />
        ),
        [isLoading, props]
      ),
  };

  return {
    FormComponents,
    noJobsiteMaterial,
    ...form,
  };
};
