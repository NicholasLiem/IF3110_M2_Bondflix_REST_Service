import {Request, Response, Router} from "express";
import {GenreController} from "../../../application/controllers/genre.controller";
import {user_jwt_middleware} from "../middlewares/user_jwt_auth.middleware";
import {admin_jwt_middleware} from "../middlewares/admin_jwt_auth.middleware";

export function genreRoutes(controller: GenreController): Router {
    const router = Router();

    /**
     * Find all genre route
     */
    router.get('/', user_jwt_middleware, (req: Request, res: Response) => {
        controller.getAllGenre(req, res).then(() => {});
    })

    /**
     * Find genre by id route
     */
    router.get('/:id', user_jwt_middleware, (req: Request, res: Response) => {
        controller.getGenreById(req, res).then(() => {});
    })

    /**
     * Find genre by name
     * Although better if I change this to use query instead of params.
     */
    router.get('/:name', user_jwt_middleware, (req: Request, res: Response) => {
        controller.getGenreByName(req, res).then(() => {});
    })

    /**
     * Create genre by id
     */
    router.post('/', admin_jwt_middleware, (req: Request, res: Response) => {
        controller.createGenre(req, res).then(() => {});
    })

    /**
     * Update genre by id
     */
    router.put('/:id', admin_jwt_middleware, (req: Request, res: Response) => {
        controller.updateGenre(req, res).then(() => {});
    })

    /**
     * Delete genre by id
     */
    router.delete('/:id', admin_jwt_middleware, (req: Request, res: Response) => {
        controller.deleteGenre(req, res).then(() => {});
    })


    return router;
}