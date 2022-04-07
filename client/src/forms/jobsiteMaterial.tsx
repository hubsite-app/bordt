import React from "react";

import { yupResolver } from "@hookform/resolvers/yup";
import {
  Controller,
  SubmitHandler,
  useForm,
  UseFormProps,
} from "react-hook-form";
import * as yup from "yup";

import { IFormProps } from "../typescript/forms";
import TextField, { ITextField } from "../components/Common/forms/TextField";
import MaterialSearch from "../components/Search/MaterialSearch";
import CompanySearch from "../components/Search/CompanySearch";
import {
  JobsiteMaterialCreateData,
  JobsiteMaterialUpdateData,
} from "../generated/graphql";
import Number, { INumber } from "../components/Common/forms/Number";
import Units, { IUnit } from "../components/Common/forms/Unit";
import Rates, { IRates } from "../components/Common/forms/Rates";

const JobsiteMaterialCreateSchema = yup
  .object()
  .shape({
    materialId: yup.string().required("please enter a material"),
    supplierId: yup.string().required("please enter a supplier"),
    quantity: yup.number().required("please enter a quantity"),
    unit: yup.string().required("please enter a unit"),
    rates: yup.array().of(
      yup.object().shape({
        date: yup
          .date()
          .required("please provide a date")
          .typeError("please provide a date"),
        rate: yup
          .number()
          .required("please provide a rate")
          .typeError("please provide a rate"),
      })
    ),
  })
  .required();

export const useJobsiteMaterialCreateForm = (options?: UseFormProps) => {
  const form = useForm({
    resolver: yupResolver(JobsiteMaterialCreateSchema),
    defaultValues: {
      quantity: 0,
      rates: [
        {
          rate: 0,
          date: new Date(),
        },
      ],
      ...options?.defaultValues,
    },
    ...options,
  });

  const { handleSubmit, control, setValue } = form;

  const FormComponents = {
    Form: ({
      children,
      submitHandler,
    }: {
      children: React.ReactNode;
      submitHandler: SubmitHandler<JobsiteMaterialCreateData>;
    }) => <form onSubmit={handleSubmit(submitHandler)}>{children}</form>,
    Material: ({ isLoading, ...props }: IFormProps<ITextField>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="materialId"
            render={({ field, fieldState }) => (
              <MaterialSearch
                {...props}
                {...field}
                errorMessage={fieldState.error?.message}
                label="Material"
                isDisabled={isLoading}
                materialSelected={(material) =>
                  setValue("materialId", material._id)
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
            name="supplierId"
            render={({ field, fieldState }) => (
              <CompanySearch
                {...props}
                {...field}
                errorMessage={fieldState.error?.message}
                label="Supplier"
                isDisabled={isLoading}
                companySelected={(company) =>
                  setValue("supplierId", company._id)
                }
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
              <Units
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
    Rates: ({ isLoading, ...props }: IFormProps<Omit<IRates, "rates">>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="rates"
            render={({ field, fieldState }) => (
              <Rates
                {...props}
                {...field}
                rates={field.value}
                errors={fieldState.error as any}
                isLoading={isLoading}
              />
            )}
          />
        ),
        [isLoading, props]
      ),
  };

  return {
    FormComponents,
    ...form,
  };
};

const JobsiteMaterialUpdateSchema = yup
  .object()
  .shape({
    supplierId: yup.string().required("please enter a supplier"),
    quantity: yup.number().required("please enter a quantity"),
    unit: yup.string().required("please enter a unit"),
    rates: yup.array().of(
      yup.object().shape({
        date: yup
          .date()
          .required("please provide a date")
          .typeError("please provide a date"),
        rate: yup
          .number()
          .required("please provide a rate")
          .typeError("please provide a rate"),
      })
    ),
  })
  .required();

export const useJobsiteMaterialUpdateForm = (options?: UseFormProps) => {
  const form = useForm({
    resolver: yupResolver(JobsiteMaterialUpdateSchema),
    defaultValues: {
      quantity: 0,
      rate: 0,
      ...options?.defaultValues,
    },
    ...options,
  });

  const { handleSubmit, control, setValue } = form;

  const FormComponents = {
    Form: ({
      children,
      submitHandler,
    }: {
      children: React.ReactNode;
      submitHandler: SubmitHandler<JobsiteMaterialUpdateData>;
    }) => <form onSubmit={handleSubmit(submitHandler)}>{children}</form>,
    Supplier: ({ isLoading, ...props }: IFormProps<ITextField>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="supplierId"
            render={({ field, fieldState }) => (
              <CompanySearch
                {...props}
                {...field}
                errorMessage={fieldState.error?.message}
                label="Supplier"
                isDisabled={isLoading}
                companySelected={(company) =>
                  setValue("supplierId", company._id)
                }
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
              <Units
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
    Rates: ({ isLoading, ...props }: IFormProps<Omit<IRates, "rates">>) =>
      React.useMemo(
        () => (
          <Controller
            control={control}
            name="rates"
            render={({ field, fieldState }) => (
              <Rates
                {...props}
                {...field}
                rates={field.value}
                errors={fieldState.error as any}
                isLoading={isLoading}
              />
            )}
          />
        ),
        [isLoading, props]
      ),
  };

  return {
    FormComponents,
    ...form,
  };
};
