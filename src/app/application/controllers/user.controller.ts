import {Request, Response} from "express";
import {UserService} from "../services/user.service";
import {ResponseUtil} from "../../utils/response.utils";
import {LoginSchema} from "../../schema/auth/login.schema";
import {RegisterSchema} from "../../schema/auth/register.schema";
import {CreateUserSchema} from "../../schema/user/create_user.schema";
import {UpdateUserSchema} from "../../schema/user/update_user.schema";
import {handle_error} from "../../utils/handle_error.utils";
import {verifyJWT} from "../../utils/jwt.utils";
import {SoapClient} from "../../adapters/soap/soap.client";

const JWT_COOKIE_MAX_AGE = 1800000;

/**
 * What to do in Controllers:
 * 1. Handle HTTP Request
 * 2. Validation of Input (Use Zod or What)
 * 3. Don't Implement Business Logic
 * 4. Don't Access DB directly
 */

export class UserController {
    private userService: UserService;
    constructor(userService: UserService) {
        this.userService = userService;
    }

    async getUsers(req: Request, res: Response) {
        try {
            const username = req.query.username as string;
            if (username) {
                const user = await this.userService.findUserByUsername(
                    username
                );
                if (user) {
                    return ResponseUtil.sendResponse(
                        res,
                        200,
                        "User retrieved successfully",
                        user
                    );
                } else {
                    return ResponseUtil.sendError(
                        res,
                        404,
                        "User not found",
                        null
                    );
                }
            } else {
                const allUsers = await this.userService.getAllUsers();

                if (allUsers && allUsers.length > 0) {
                    return ResponseUtil.sendResponse(
                        res,
                        200,
                        "Success",
                        allUsers
                    );
                } else {
                    return ResponseUtil.sendResponse(
                        res,
                        404,
                        "No user found",
                        null
                    );
                }
            }
        } catch (error) {
            handle_error(res, error);
        }
    }

    async createUser(req: Request, res: Response) {
        try {
            const { username, name, email, password, isAdmin } =
                CreateUserSchema.parse(req.body);
            const success = await this.userService.createUser(
                username,
                name,
                email,
                password,
                isAdmin
            );
            if (success) {
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "User created successfully",
                    null
                );
            } else {
                return ResponseUtil.sendError(res, 404, "User not found", null);
            }
        } catch (error) {
            handle_error(res, error);
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const userId = parseInt(req.params.id, 10);
            //@ts-ignore
            if (userId !== req.userId && !req.isAdmin){
                return ResponseUtil.sendError(res, 401, "Unauthorized", null)
            }

            const { ...updatedUser } = UpdateUserSchema.parse(req.body);

            let updateProfilePicture = false
            // @ts-ignore
            if (req.files["picture_file"]) {
                // @ts-ignore
                updatedUser.pp_url =  req.files['picture_file'][0].path
                updateProfilePicture = true
            }

            const success = await this.userService.updateUser(
                userId,
                updatedUser,
                updateProfilePicture
            );
           
            if (success) {
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "User updated successfully",
                    null
                );
            } else {
                return ResponseUtil.sendError(res, 404, "User not found", null);
            }
        } catch (error) {
            console.log(error)
            handle_error(res, error);
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id, 10);
            const success = await this.userService.deleteUser(id);
            if (success) {
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "User deleted successfully",
                    null
                );
            } else {
                return ResponseUtil.sendError(res, 404, "User not found", null);
            }
        } catch (error) {
            handle_error(res, error);
        }
    }
    async getUserById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id, 10);
            const user = await this.userService.findUserById(id);
            //@ts-ignore
            if (id !== req.userId && !req.isAdmin){
                return ResponseUtil.sendError(res, 401, "Unauthorized", null)
            }

            if (user) {
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "User retrieved successfully",
                    user
                );
            } else {
                return ResponseUtil.sendError(res, 404, "User not found", null);
            }
        } catch (error) {
            handle_error(res, error);
        }
    }

    async getUserByName(req: Request, res: Response) {
        try {
            const name = req.query.name;

            let usersByName;
            if (name !== undefined) {
                //@ts-ignore
                usersByName = await this.userService.findUserByName(name);
            }
            if (usersByName) {
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "Users retrieved successfully",
                    usersByName
                );
            } else {
                return ResponseUtil.sendError(res, 404, "Users not found", null);
            }
        } catch (error) {
            handle_error(res, error)
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { identifier, password } = LoginSchema.parse(req.body);
            const token: string | null = await this.userService.authenticate(
                identifier,
                password
            );
            if (token) {
                res.cookie("bondflix-auth-jwt", token, {
                    maxAge: JWT_COOKIE_MAX_AGE,
                    httpOnly: true,
                    sameSite: "strict",
                });

                const decoded = verifyJWT(token);
                //@ts-ignore
                res.cookie("userId", decoded.payload.userId, {
                    maxAge: JWT_COOKIE_MAX_AGE,
                })
                //@ts-ignore
                res.cookie("isAdmin", decoded.payload.isAdmin,  {
                    maxAge: JWT_COOKIE_MAX_AGE,
                })

                if (decoded) {
                    return ResponseUtil.sendResponse(
                        res,
                        200,
                        "Login successful",
                        decoded.payload
                    );
                } else {
                    return ResponseUtil.sendError(
                        res,
                        404,
                        "Authentication failed",
                        null
                    );
                }
            } else {
                return ResponseUtil.sendError(
                    res,
                    404,
                    "Authentication failed",
                    null
                );
            }
        } catch (error) {
            handle_error(res, error);
        }
    }

    async signup(req: Request, res: Response) {
        try {
            const { username, name, email, password } = RegisterSchema.parse(req.body);
            const success = await this.userService.createUser(
                username,
                name,
                email,
                password,
                false
            );
            if (success) {
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "Registration successful",
                    null
                );
            } else {
                return ResponseUtil.sendError(
                    res,
                    500,
                    "Registration failed",
                    null
                );
            }
        } catch (error) {
            handle_error(res, error);
        }
    }

    async logout(req: Request, res: Response) {
        try {
            res.clearCookie("bondflix-auth-jwt");
            res.clearCookie("userId");
            return ResponseUtil.sendResponse(
                res,
                200,
                "Logout successful",
                null
            );
        } catch (error) {
            handle_error(res, error);
        }
    }

    async autoLogin(req: Request, res: Response) {
        try {
            const token = req.cookies["bondflix-auth-jwt"];

            if (!token) {
                return ResponseUtil.sendError(res, 404, "No token", null);
            }

            const decoded = verifyJWT(token);

            if (decoded.payload) {
                // @ts-ignore
                const { userId, username, name, expiresIn, issuedAt, isAdmin } =
                    decoded.payload;
                // @ts-ignore
                req.userId = userId;
                // @ts-ignore
                req.username = username;
                // @ts-ignore
                req.name = name;
                // @ts-ignore
                req.expiresIn = expiresIn;
                // @ts-ignore
                req.issuedAt = issuedAt;
                // @ts-ignore
                req.isAdmin = isAdmin;
                return ResponseUtil.sendResponse(
                    res,
                    200,
                    "Login successful",
                    null
                );
            }
        } catch (error) {
            handle_error(res, error);
        }
    }

    async getSubscriptionEmail(req: Request, res: Response) {
        try {
            const creatorId = parseInt(req.params.creatorId, 10)
            const data = await SoapClient.getInstance().getAllSubscriberFromCreator(
                creatorId
            );

            const emails = await Promise.all(Object.values(data).map(async (id) => {
                return await this.getEmailById(parseInt(id, 10));
            }));

            return ResponseUtil.sendResponse(res, 200, "Ok", emails);
        } catch (error) {
            handle_error(res, error);
        }
    }

    async getEmailById(id: number) {
        const user = await this.userService.findUserById(id);
        return user?.email;
    }
}
