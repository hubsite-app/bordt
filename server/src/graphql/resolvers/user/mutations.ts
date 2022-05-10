import { Field, InputType } from "type-graphql";

import { Signup, User, UserDocument } from "@models";
import { decode, JwtPayload } from "jsonwebtoken";
import { Id } from "@typescript/models";
import { UserHomeViewSettings, UserRoles } from "@typescript/user";
import { IContext } from "@typescript/graphql";

@InputType()
export class LoginData {
  @Field({ nullable: false })
  public email!: string;

  @Field({ nullable: false })
  public password!: string;

  @Field({ nullable: false })
  public rememberMe!: boolean;
}

@InputType()
export class SignupData {
  @Field({ nullable: false })
  public name!: string;

  @Field({ nullable: false })
  public email!: string;

  @Field({ nullable: false })
  public password!: string;
}

const login = (data: LoginData) => {
  return User.login(data.email, data.password, data.rememberMe);
};

const signup = async (signupId: string, data: SignupData): Promise<string> => {
  const signup = await Signup.getById(signupId, { throwError: true });
  if (!signup) throw new Error("Unable to find signup");

  const user = await User.createDocument(signup, data);

  await user.save();

  await signup.remove();

  const token = await User.login(user.email, data.password, true);

  return token;
};

const passwordResetRequest = async (email: string): Promise<boolean> => {
  const user = await User.getByEmail(email);
  if (!user) throw new Error("Unable to find user with that email");

  const token = await user.setResetPasswordToken();

  await user.save();

  await user.sendEmail({
    subject: "Bow Mark - Password Reset",
    html: `Follow link to reset password: ${token}`,
    plainText: `Follow link to reset password: ${token}`,
  });

  return true;
};

const passwordReset = async (
  password: string,
  token: string
): Promise<boolean> => {
  const user = await User.getByResetPasswordToken(token);
  if (!user) throw new Error("Invalid token, please try the process again");

  const decoded = decode(token) as JwtPayload;

  if (decoded.exp && decoded.exp * 1000 < new Date().getTime())
    throw new Error(
      "Your reset link has expired, pleas try the proocess again"
    );

  await user.updatePassword(password);

  await user.save();

  return true;
};

const role = async (id: Id, role: UserRoles): Promise<UserDocument> => {
  const user = await User.getById(id, { throwError: true });
  if (!user) throw new Error("Unable to find user");

  await user.updateRole(role);

  await user.save();

  return user;
};

const updateHomeView = async (
  context: IContext,
  homeView: UserHomeViewSettings
): Promise<UserDocument> => {
  if (!context.user) throw new Error("cannot find user");

  if (parseInt(context.user.role.toString()) < 2 && homeView === 2)
    throw new Error("User does not have permission for this home view");

  await context.user.updateHomeView(homeView);

  await context.user.save();

  return context.user;
};

export default {
  login,
  signup,
  role,
  passwordResetRequest,
  passwordReset,
  updateHomeView,
};