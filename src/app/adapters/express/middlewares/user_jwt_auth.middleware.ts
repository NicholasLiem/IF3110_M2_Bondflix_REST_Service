import {NextFunction, Request, Response} from "express";
import {ResponseUtil} from "../../../utils/response.utils";
import {verifyJWT} from "../../../utils/jwt.utils";

export function user_jwt_middleware(req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization');

    if (!token || !token.startsWith('Bearer ')) {
        return ResponseUtil.sendError(res, 401, "Unauthorized", null);
    }

    const tokenWithoutBearer = token.substring(7);

    try {
        const decoded = verifyJWT(tokenWithoutBearer);
        if (decoded.payload) {
            // @ts-ignore
            const { userId, username, name, expiresIn, issuedAt, isAdmin } = decoded.payload;
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
            next();
        } else {
            return ResponseUtil.sendError(res, 401, "Unauthorized", null);
        }
    } catch (error) {
        return ResponseUtil.sendError(res, 401, "Unauthorized", null);
    }
}

