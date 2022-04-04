import { registerEnumType } from "type-graphql";

export interface IUserCreate {
  name: string;
  email: string;
  password: string;
}

export enum UserRoles {
  User = 1,
  ProjectManager = 2,
  Admin = 3,
}

registerEnumType(UserRoles, {
  name: "UserRoles",
});
